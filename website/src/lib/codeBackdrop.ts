/** The source code the 404 page's cursor light uncovers (see CursorGlow): a stretch of low-level .NET
 * runtime code, as if it were what runs behind the page. Lines are ragged on purpose, short ones next to
 * long chained calls. It is the same every visit and stays put while the light moves over it. */

const SOURCE = String.raw`using System.Buffers;
using System.IO.Pipelines;
using System.Net.Sockets;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Threading.Channels;

namespace Runtime.Core.Execution;

internal sealed class MemorySegmentProcessor<T> : IAsyncDisposable where T : unmanaged
{
    private readonly ArrayPool<T> _pool = ArrayPool<T>.Shared;
    private readonly Channel<MemoryOperation<T>> _operations = Channel.CreateBounded<MemoryOperation<T>>(new BoundedChannelOptions(1024) { FullMode = BoundedChannelFullMode.Wait, SingleReader = true, SingleWriter = false, AllowSynchronousContinuations = false });
    private readonly CancellationTokenSource _shutdown = new();
    private readonly Task _worker;
    private long _processedBytes, _operationCount, _allocationPressure;
    private int _state;

    public MemorySegmentProcessor() => _worker = Task.Run(ProcessOperationsAsync);

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public static int CompareSegments(ReadOnlySpan<T> left, ReadOnlySpan<T> right)
    {
        var length = Math.Min(left.Length, right.Length);
        for (var offset = 0; offset < length; offset++)
            if (!EqualityComparer<T>.Default.Equals(left[offset], right[offset])) return Comparer<T>.Default.Compare(left[offset], right[offset]);
        return left.Length.CompareTo(right.Length);
    }

    public async ValueTask<int> ProcessAsync(ReadOnlyMemory<T> source, Memory<T> destination, CancellationToken cancellationToken = default)
    {
        ObjectDisposedException.ThrowIf(Volatile.Read(ref _state) != 0, this);
        if (destination.Length < source.Length) throw new ArgumentException("Destination buffer is smaller than the input segment.", nameof(destination));

        var rented = _pool.Rent(Math.Max(source.Length, 1));
        try
        {
            source.Span.CopyTo(rented.AsSpan());
            var written = await TransformSegmentAsync(rented.AsMemory(0, source.Length), cancellationToken).ConfigureAwait(false);
            rented.AsMemory(0, written).CopyTo(destination);
            Interlocked.Add(ref _processedBytes, (long)written * Unsafe.SizeOf<T>());
            Interlocked.Increment(ref _operationCount);
            return written;
        }
        finally
        {
            _pool.Return(rented, clearArray: RuntimeHelpers.IsReferenceOrContainsReferences<T>());
        }
    }

    private async ValueTask<int> TransformSegmentAsync(Memory<T> segment, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var span = segment.Span;
        for (var index = 0; index < span.Length; index++)
            span[index] = TransformValue(span[index], index, Volatile.Read(ref _operationCount));
        await Task.CompletedTask.ConfigureAwait(false);
        return segment.Length;
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static T TransformValue(T value, int index, long sequence)
    {
        ref var reference = ref MemoryMarshal.GetReference(MemoryMarshal.CreateSpan(ref value, 1));
        return Unsafe.Add(ref reference, 0);
    }

    private async Task ProcessOperationsAsync()
    {
        try
        {
            await foreach (var operation in _operations.Reader.ReadAllAsync(_shutdown.Token).ConfigureAwait(false))
            {
                try { await operation.ExecuteAsync(_shutdown.Token).ConfigureAwait(false); }
                catch (OperationCanceledException) when (_shutdown.IsCancellationRequested) { break; }
                catch (Exception exception) { operation.Fail(exception); }
            }
        }
        catch (OperationCanceledException) when (_shutdown.IsCancellationRequested) { }
    }

    public (long ProcessedBytes, long OperationCount, long AllocationPressure) GetMetrics()
        => (Interlocked.Read(ref _processedBytes), Interlocked.Read(ref _operationCount), Interlocked.Read(ref _allocationPressure));

    public async ValueTask DisposeAsync()
    {
        if (Interlocked.Exchange(ref _state, 1) != 0) return;
        _operations.Writer.TryComplete();
        _shutdown.Cancel();
        try { await _worker.ConfigureAwait(false); }
        finally { _shutdown.Dispose(); }
    }
}

internal sealed class NativeBufferOwner<T> : IMemoryOwner<T> where T : unmanaged
{
    private T[]? _buffer;
    private readonly int _length;

    public NativeBufferOwner(int length)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(length);
        _length = length;
        _buffer = ArrayPool<T>.Shared.Rent(Math.Max(length, 1));
    }

    public Memory<T> Memory => (_buffer ?? throw new ObjectDisposedException(nameof(NativeBufferOwner<T>))).AsMemory(0, _length);

    public void Dispose()
    {
        var buffer = Interlocked.Exchange(ref _buffer, null);
        if (buffer is not null) ArrayPool<T>.Shared.Return(buffer, RuntimeHelpers.IsReferenceOrContainsReferences<T>());
    }
}

internal static class RuntimeDiagnostics
{
    [MethodImpl(MethodImplOptions.NoInlining)]
    public static string CaptureExecutionState()
    {
        var trace = new System.Diagnostics.StackTrace(fNeedFileInfo: false);
        var frames = trace.GetFrames() ?? Array.Empty<System.Diagnostics.StackFrame>();
        return string.Join(" -> ", frames.Select(static frame => frame.GetMethod()).Where(static method => method is not null).Select(static method => $"{method!.DeclaringType?.FullName}::{method.Name}"));
    }
}`;

/** The listing cut into whole members: a break is a blank line between two members of a class (or
 * two classes), never one inside a method, so a run of chunks always starts and ends cleanly. */
function chunks(lines: string[]): string[][] {
  const out: string[][] = [];
  let current: string[] = [];
  let depth = 0;
  for (const line of lines) {
    if (!line.trim() && depth <= 1 && current.length) {
      out.push(current);
      current = [];
      continue;
    }
    current.push(line);
    for (const ch of line) {
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
    }
  }
  if (current.length) out.push(current);
  return out;
}

export const CODE_CHUNKS = chunks(SOURCE.split("\n"));

/** A stretch of server log for the address that was not found: the other thing the page can be
 * showing now and then, in place of code. One of a few shapes, with timings that are never quite the same. */
export function logLines(path: string): string[] {
  const p = path.length > 90 ? `${path.slice(0, 87)}...` : path;
  const url = `${window.location.origin}${p}`;
  const ms = () => (0.2 + Math.random() * 1.6).toFixed(4);
  const shapes: Array<() => string[]> = [
    () => [
      "info: Microsoft.AspNetCore.Hosting.Diagnostics[1]",
      `      Request starting HTTP/2 GET ${url} - - -`,
      "dbug: Microsoft.AspNetCore.Routing.Matching.DfaMatcher[1001]",
      `      1 candidate(s) found for the request path '${p}'`,
      "dbug: Microsoft.AspNetCore.Routing.Matching.DfaMatcher[1005]",
      `      Endpoint 'Fallback {*path:nonfile}' with route pattern '{*path:nonfile}' is valid for the request path '${p}'`,
      "info: Microsoft.AspNetCore.Routing.EndpointMiddleware[0]",
      "      Executing endpoint 'Fallback {*path:nonfile}'",
      "info: Microsoft.AspNetCore.StaticFiles.StaticFileMiddleware[6]",
      `      The request path ${p} does not match a supported file type`,
      "info: Microsoft.AspNetCore.Hosting.Diagnostics[2]",
      `      Request finished HTTP/2 GET ${url} - 404 - text/html;+charset=utf-8 ${ms()}ms`,
    ],
    () => [
      "warn: Microsoft.AspNetCore.Routing.EndpointMiddleware[0]",
      `      No endpoint matched the request path '${p}'`,
      "fail: Portfolio.Web.Errors.NotFoundExceptionHandler[0]",
      `      Portfolio.Web.Errors.NotFoundException: Page '${p}' was not found.`,
      "         at Portfolio.Web.Routing.PageResolver.ResolveAsync(String path, CancellationToken ct) in /src/Portfolio.Web/Routing/PageResolver.cs:line 48",
      "         at Portfolio.Web.Middleware.MovedPagesMiddleware.InvokeAsync(HttpContext context) in /src/Portfolio.Web/Middleware/MovedPagesMiddleware.cs:line 27",
      "         at Microsoft.AspNetCore.Diagnostics.StatusCodePagesMiddleware.Invoke(HttpContext context)",
      "         at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.Invoke(HttpContext context)",
      "info: Microsoft.AspNetCore.Hosting.Diagnostics[2]",
      `      Request finished HTTP/2 GET ${url} - 404 - application/problem+json;+charset=utf-8 ${ms()}ms`,
    ],
    () => [
      `Unhandled exception. Portfolio.Web.Errors.NotFoundException: Page '${p}' was not found.`,
      "   at Portfolio.Web.Routing.PageResolver.ResolveAsync(String path, CancellationToken ct) in /src/Portfolio.Web/Routing/PageResolver.cs:line 48",
      "   at Portfolio.Web.Routing.PageEndpoint.HandleAsync(HttpContext context) in /src/Portfolio.Web/Routing/PageEndpoint.cs:line 19",
      "   at Microsoft.AspNetCore.Routing.EndpointMiddleware.<Invoke>g__AwaitRequestTask|7_0(Endpoint endpoint, Task requestTask, ILogger logger)",
      "   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)",
      "   at Microsoft.AspNetCore.Diagnostics.DeveloperExceptionPageMiddlewareImpl.Invoke(HttpContext context)",
      `fail: Microsoft.AspNetCore.Server.Kestrel[13]`,
      `      Connection id "0HN4F0K7TG2UQ", Request id "0HN4F0K7TG2UQ:00000001": An unhandled exception was thrown by the application.`,
    ],
  ];
  return shapes[Math.floor(Math.random() * shapes.length)]();
}

const KEYWORDS =
  "using|namespace|where|unmanaged|finally|foreach|for|break|continue|struct|interface|enum|unsafe|static|var|new|public|private|protected|internal|static|readonly|sealed|override|class|record|async|await|return|if|else|try|catch|when|throw|is|null|true|false|void|string|int|bool|long|in|out|ref|and|or|not|this|nameof|typeof|default|get|set";
const TOKEN = new RegExp(
  [
    String.raw`(\/\/.*$)`,
    String.raw`(\$?"(?:[^"\\]|\\.)*")`,
    String.raw`(^\s*\[[A-Za-z][^\]]*\])`,
    String.raw`(\b(?:${KEYWORDS})\b)`,
    String.raw`(\b[A-Za-z_]\w*(?=\())`,
    String.raw`(\b[A-Z]\w*)`,
    String.raw`(\b\d[\d_.]*\b)`,
  ].join("|"),
  "g",
);
export type Piece = { text: string; kind: "plain" | "comment" | "string" | "attr" | "keyword" | "method" | "type" | "number" | "info" | "dbug" | "warn" | "fail" };
const KINDS: Piece["kind"][] = ["plain", "comment", "string", "attr", "keyword", "method", "type", "number"];
const LOG_LABEL = /^(info|dbug|warn|fail):/;

/** Splits a line into runs of text of one kind each, for colouring. */
export function tokenize(line: string): Piece[] {
  const label = LOG_LABEL.exec(line);
  if (label) return [{ text: label[0], kind: label[1] as Piece["kind"] }, ...tokenize(line.slice(label[0].length))];
  const out: Piece[] = [];
  let at = 0;
  for (const m of line.matchAll(TOKEN)) {
    const index = m.index ?? 0;
    if (index > at) out.push({ text: line.slice(at, index), kind: "plain" });
    const group = m.findIndex((g, i) => i > 0 && g !== undefined);
    out.push({ text: m[0], kind: KINDS[group] });
    at = index + m[0].length;
  }
  if (at < line.length) out.push({ text: line.slice(at), kind: "plain" });
  return out;
}

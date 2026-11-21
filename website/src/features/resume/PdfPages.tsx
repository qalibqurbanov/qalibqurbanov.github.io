import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useRef, useState } from "react";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/** A sharp picture on a dense screen costs memory; past this the extra sharpness is not worth it. */
const MAX_PIXEL_RATIO = 2.5;

interface PdfPagesProps {
  url: string;
  /** What screen readers call the document. */
  label: string;
  /** Shown instead of the pages when the file cannot be read. */
  failedText: string;
  /** The link that opens the file itself, offered with the failure text. */
  openText: string;
  /** Called once with the number of pages when the file has been read. */
  onLoaded?: (pages: number) => void;
}

/** The pages of a PDF, drawn one under another as plain white sheets, as wide as the column they sit in.
 * This is the site's own viewer: none of the browser's PDF controls (toolbar, thumbnails, menus) come with it. */
export function PdfPages({ url, label, failedText, openText, onLoaded }: PdfPagesProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const task = pdfjs.getDocument({ url });
    // A task that was cancelled by this cleanup ends in an error too; only a task still wanted can fail.
    task.promise.then(
      (loaded) => {
        if (cancelled) return;
        setDoc(loaded);
        onLoaded?.(loaded.numPages);
      },
      () => !cancelled && setFailed(true),
    );
    return () => {
      cancelled = true;
      void task.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    const column = columnRef.current;
    if (!column) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(column);
    return () => observer.disconnect();
  }, []);

  // Draws every page at the width of the column; it draws again when the column changes width.
  useEffect(() => {
    if (!doc || width === 0) return;
    let cancelled = false;
    const tasks: RenderTask[] = [];
    void (async () => {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      for (let number = 1; number <= doc.numPages; number += 1) {
        const page = await doc.getPage(number);
        const canvas = canvases.current[number - 1];
        if (cancelled || !canvas) return;
        const viewport = page.getViewport({ scale: (width / page.getViewport({ scale: 1 }).width) * ratio });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const task = page.render({ canvas, viewport });
        tasks.push(task);
        await task.promise.catch(() => undefined);
      }
    })();
    return () => {
      cancelled = true;
      tasks.forEach((task) => task.cancel());
    };
  }, [doc, width]);

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-sm text-muted">
        <p>{failedText}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-line inline-flex items-center px-4 py-2 text-sm font-medium">
          {openText}
        </a>
      </div>
    );
  }

  return (
    <div ref={columnRef} role="document" aria-label={label} className="w-full space-y-2 sm:space-y-3">
      {doc ? (
        Array.from({ length: doc.numPages }, (_, index) => (
          <canvas
            key={index}
            ref={(node) => {
              canvases.current[index] = node;
            }}
            className="block h-auto w-full rounded-[3px] bg-white shadow-[0_10px_30px_-8px_rgb(0_0_0/0.55)] ring-1 ring-black/20"
          />
        ))
      ) : (
        <div className="aspect-[1/1.414] w-full animate-pulse rounded-sm bg-surface-2" aria-hidden="true" />
      )}
    </div>
  );
}

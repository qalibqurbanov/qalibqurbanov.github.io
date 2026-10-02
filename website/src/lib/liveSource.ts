/** What a live source currently holds. */
export interface LiveState<T> {
  /** The newest value: from the last successful fetch, else a saved or built-in copy. */
  value: T | null;
  /** True while the most recent fetch succeeded — i.e. `value` really is current. */
  live: boolean;
}

/** A value kept up to date by polling for as long as something is listening.
 *
 * It fetches as soon as the first listener appears, then again every
 * `intervalMs` while the tab is visible, and right away when the tab comes back
 * to the foreground after being away longer than that — so nothing on screen
 * is ever older than about a minute, however long the page stays open. The last
 * good value is also saved in `localStorage` so the next visit starts from it
 * and not from the (older) copy baked in at build time. Shaped for React's
 * `useSyncExternalStore`: `subscribe` and `getSnapshot` are bound and the
 * snapshot object only changes when the state really does. */
export class LiveSource<T> {
  private state: LiveState<T>;
  private readonly listeners = new Set<() => void>();
  private timer: number | undefined;
  private busy = false;
  private lastRun = 0;
  private readonly load: (previous: T | null) => Promise<T>;
  private readonly intervalMs: number;
  private readonly storageKey: string;

  /**
   * @param load Fetches the current value. Receives the previous one, to keep parts a partial failure could not refresh.
   * @param initial Shown until the first fetch lands, if nothing newer was saved.
   */
  constructor(load: (previous: T | null) => Promise<T>, initial: T | null, intervalMs: number, storageKey: string) {
    this.load = load;
    this.intervalMs = intervalMs;
    this.storageKey = storageKey;
    this.state = { value: this.restore() ?? initial, live: false };
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) this.start();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stop();
    };
  };

  readonly getSnapshot = (): LiveState<T> => this.state;

  private start() {
    void this.refresh();
    this.timer = window.setInterval(() => {
      if (!document.hidden) void this.refresh();
    }, this.intervalMs);
    document.addEventListener("visibilitychange", this.wake);
    window.addEventListener("focus", this.wake);
  }

  private stop() {
    window.clearInterval(this.timer);
    document.removeEventListener("visibilitychange", this.wake);
    window.removeEventListener("focus", this.wake);
  }

  /** Back on screen after a while: catch up now instead of waiting for the next tick. */
  private readonly wake = () => {
    if (!document.hidden && Date.now() - this.lastRun >= this.intervalMs) void this.refresh();
  };

  private async refresh() {
    if (this.busy) return;
    this.busy = true;
    this.lastRun = Date.now();
    try {
      const value = await this.load(this.state.value);
      this.save(value);
      this.set({ value, live: true });
    } catch {
      // Offline or rate limited: keep what is shown, but stop claiming it is live.
      this.set({ value: this.state.value, live: false });
    } finally {
      this.busy = false;
    }
  }

  private set(next: LiveState<T>) {
    if (next.live === this.state.live && JSON.stringify(next.value) === JSON.stringify(this.state.value)) return;
    this.state = next;
    this.listeners.forEach((listener) => listener());
  }

  private restore(): T | null {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private save(value: T) {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(value));
    } catch {
      // Storage may be unavailable (private mode, blocked); the next visit just starts from the build's copy.
    }
  }
}

/** GET JSON from the GitHub API. `no-cache` makes the browser revalidate with
 * the ETag on every poll: an unchanged answer is a 304, which GitHub does not
 * count against its 60-requests-an-hour anonymous limit, so polling stays cheap. */
export async function getGithubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
    cache: "no-cache",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(String(response.status));
  return (await response.json()) as T;
}

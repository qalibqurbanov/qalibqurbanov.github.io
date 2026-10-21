/** One requestAnimationFrame loop shared by everything that animates all the
 * time (fireflies, butterflies, cursor, clock). It runs only while there is a
 * subscriber and the tab is visible, so a hidden tab does no animation work at
 * all, and each subscriber can ask for a lower rate. */

type Tick = (now: number) => void;

interface Sub {
  fn: Tick;
  /** Minimum time between calls, in ms (0 = every frame). */
  every: number;
  last: number;
}

const subs = new Set<Sub>();
let raf = 0;

function loop(now: number): void {
  raf = 0;
  for (const sub of [...subs]) {
    if (now - sub.last < sub.every - 1) continue;
    sub.last = now;
    sub.fn(now);
  }
  schedule();
}

function schedule(): void {
  if (raf || subs.size === 0 || document.hidden) return;
  raf = requestAnimationFrame(loop);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else schedule();
  });
}

/** Calls `fn` on each animation frame (or at most every `every` ms). Returns the unsubscribe. */
export function subscribeTick(fn: Tick, every = 0): () => void {
  const sub: Sub = { fn, every, last: 0 };
  subs.add(sub);
  schedule();
  return () => {
    subs.delete(sub);
    if (subs.size === 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

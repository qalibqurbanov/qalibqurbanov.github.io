/** How long the visitor has been idle (no pointer, key, scroll or touch input).
 * One clock shared by everything that reacts to it: the butterflies that come
 * to circle the cursor, the cursor's own countdown, and the fireflies. */

/** Idle time after which the butterflies are called. */
export const IDLE_MS = 15000;
/** The countdown only shows after this much stillness, and fades in over the next 0.6 s. */
const SHOW_AFTER_MS = 900;

let lastActive = typeof performance === "undefined" ? 0 : performance.now();
let installed = false;

/** Marks the visitor as active right now. */
export function wake(): void {
  lastActive = performance.now();
}

function install(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const opts = { passive: true } as const;
  window.addEventListener("pointermove", wake, opts);
  window.addEventListener("pointerdown", wake, opts);
  window.addEventListener("keydown", wake);
  window.addEventListener("wheel", wake, opts);
  window.addEventListener("touchstart", wake, opts);
}

/** Milliseconds of stillness so far. */
export function idleFor(now: number = performance.now()): number {
  install();
  return Math.max(0, now - lastActive);
}

/** 0 → 1 over the idle countdown. */
export function idleProgress(now: number = performance.now()): number {
  return Math.min(1, idleFor(now) / IDLE_MS);
}

/** 0 → 1: how visible the countdown should be (it stays out of the way at first). */
export function idleShow(now: number = performance.now()): number {
  const k = Math.min(1, Math.max(0, (idleFor(now) - SHOW_AFTER_MS) / 600));
  return k * k * (3 - 2 * k);
}

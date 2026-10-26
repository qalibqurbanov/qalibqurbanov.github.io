/** How long the visitor has been idle (no pointer, key, scroll or touch input).
 * One clock shared by everything that reacts to it: the butterflies that come
 * to circle the cursor, the cursor's own countdown, and the fireflies. */

/** Idle time after which the butterflies are called. */
export const IDLE_MS = 30000;
/** The countdown only shows after this much stillness, and fades in over the next 0.6 s. */
const SHOW_AFTER_MS = 10000;

/** What counts as something to click (the same set the custom cursor reacts to).
 * A pointer resting on one is not idle: the visitor is about to use it. */
const CLICKABLE =
  'input:not([type="hidden"]), textarea, select, [contenteditable="true"], a[href], button:not(:disabled), summary, label[for], [role="button"], [role="tab"], [role="option"], [role="menuitem"], [role="radio"], [role="checkbox"], .cursor-pointer, .cursor-grab, .cursor-grabbing';
/** How often the element under a resting pointer is looked up. */
const HOVER_CHECK_MS = 150;

let lastActive = typeof performance === "undefined" ? 0 : performance.now();
let installed = false;
let pointerX = -1;
let pointerY = -1;
let lastCheck = 0;

function trackPointer(event: PointerEvent): void {
  pointerX = event.clientX;
  pointerY = event.clientY;
  wake();
}

function overClickable(): boolean {
  if (pointerX < 0) return false;
  const el = document.elementFromPoint(pointerX, pointerY);
  return el !== null && el.closest(CLICKABLE) !== null;
}

/** Marks the visitor as active right now. */
export function wake(): void {
  lastActive = performance.now();
}

function install(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const opts = { passive: true } as const;
  window.addEventListener("pointermove", trackPointer, opts);
  window.addEventListener("pointerdown", wake, opts);
  window.addEventListener("keydown", wake);
  window.addEventListener("wheel", wake, opts);
  window.addEventListener("touchstart", wake, opts);
}

/** Milliseconds of stillness so far. */
export function idleFor(now: number = performance.now()): number {
  install();
  if (now - lastCheck > HOVER_CHECK_MS) {
    lastCheck = now;
    if (overClickable()) lastActive = now;
  }
  return Math.max(0, now - lastActive);
}

/** 0 → 1 over the idle countdown, which starts empty once the countdown shows
 * and is full when the butterflies are called. */
export function idleProgress(now: number = performance.now()): number {
  return Math.min(1, Math.max(0, (idleFor(now) - SHOW_AFTER_MS) / (IDLE_MS - SHOW_AFTER_MS)));
}

/** 0 → 1: how visible the countdown should be (it stays out of the way at first). */
export function idleShow(now: number = performance.now()): number {
  const k = Math.min(1, Math.max(0, (idleFor(now) - SHOW_AFTER_MS) / 600));
  return k * k * (3 - 2 * k);
}

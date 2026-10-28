import { CLICKABLE } from "@/lib/interactive";

/** How long the visitor has been idle (no pointer, key, scroll or touch input).
 * One clock shared by everything that reacts to it: the butterflies that come
 * to circle the cursor, the cursor's own countdown, and the fireflies. */

/** Idle time after which the butterflies are called. */
export const IDLE_MS = 30000;
/** The countdown only shows after this much stillness, and fades in over the next 0.6 s. */
const SHOW_AFTER_MS = 10000;

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

/** True for an element that is only a layout box: it holds no text of its own and paints nothing
 * (no fill, border, image or shadow), so the visitor sees the site's background through it. */
function isBare(el: Element): boolean {
  if (el instanceof HTMLCanvasElement) return true;
  if (el.closest(CLICKABLE) !== null) return false;
  if (el instanceof SVGElement || el instanceof HTMLImageElement || el instanceof HTMLVideoElement) return false;
  for (const node of el.childNodes) if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) return false;
  // Not itself, and not any box around it (a card's padding, the navbar's gaps), may paint anything.
  for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
    if (paints(node)) return false;
  }
  return true;
}

function paints(el: Element): boolean {
  const style = getComputedStyle(el);
  return !(
    (style.backgroundColor === "rgba(0, 0, 0, 0)" || style.backgroundColor === "transparent") &&
    // Gradients are the site's own backdrop (a section's grid); only a picture is content.
    !style.backgroundImage.includes("url(") &&
    style.boxShadow === "none" &&
    style.backdropFilter === "none" &&
    parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth) === 0
  );
}

/** A pointer resting on any content (text, a card, a button, the navbar) is not idle: the visitor
 * is reading or about to use it. Only a pointer over the bare site background counts as idle. */
function overContent(): boolean {
  if (pointerX < 0) return false;
  const el = document.elementFromPoint(pointerX, pointerY);
  return el !== null && !isBare(el);
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
    if (overContent()) lastActive = now;
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

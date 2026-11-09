import { prefersReducedMotion } from "@/hooks/glitch";

/** How fast each part closes on the pointer, per second: the dot follows closely, the ring lazily. */
const DOT_SPEED = 90;
const RING_SPEED = 20;
/** The `instant` cursors: the dot is exactly at the pointer and the ring is only a frame or two behind. */
const RING_SPEED_INSTANT = 400;

export interface CursorFrame {
  /** The pointer, and where the dot and the ring are on their way to it. */
  x: number;
  y: number;
  dotX: number;
  dotY: number;
  ringX: number;
  ringY: number;
  /** Rounds a length to whole device pixels (a no-op when the tracker is not set to draw on them). */
  snap(value: number): number;
}

export interface CursorTrackerOptions {
  root: HTMLElement;
  /** Placed at the (slightly eased) pointer; the ring trails it more loosely. */
  dot: HTMLElement;
  ring: HTMLElement;
  /** What the pointer is over, as the name of a cursor state (the root's `data-state`). */
  stateOf(target: EventTarget | null): string;
  /** States in which the cursor is a text caret as tall as the line under it, and the range of that height. */
  caret: { states: string[]; min: number; max: number; ratio: number };
  /** Draw on whole device pixels, so a part is never left between two (a blurred, crooked edge). */
  whole?: boolean;
  /** Place the ring inside the dot's layer and only offset it by how far it trails, so that at rest the two
   * are drawn from one origin and cannot be off centre from each other. Otherwise it is placed on its own. */
  ringInsideDot?: boolean;
  /** No lag: the dot is placed at the pointer the moment it moves, and the ring follows closely. */
  instant?: boolean;
  /** Called just before the cursor changes state, while the old state is still drawn (to fade it out). */
  onBeforeState?(next: string): void;
  onFirstMove?(): void;
  onMove?(x: number, y: number): void;
  /** After each frame of the glide. */
  onFrame?(frame: CursorFrame): void;
  /** The pointer left the window, or it lost focus. */
  onLeave?(): void;
}

/** What every custom cursor shares: following a real mouse (never touch or pen), easing the dot and the ring
 * toward it by the clock, telling the root what is under it (`data-state`), the caret height, `is-on` and
 * `is-down`, hiding the system cursor once a mouse has moved, and looking again when the page scrolls under a
 * still pointer. How it looks is up to the cursor's own stylesheet. Returns the function that stops it. */
export function trackCursor(options: CursorTrackerOptions): () => void {
  const { root, dot, ring, stateOf, caret, whole = false, ringInsideDot = false, instant = false } = options;
  const calm = prefersReducedMotion();

  let x = 0;
  let y = 0;
  let dotX = 0;
  let dotY = 0;
  let ringX = 0;
  let ringY = 0;
  let last = 0;
  let frame = 0;
  let scrollFrame = 0;
  let seen = false;
  let state = "default";

  const snap = (value: number) => {
    if (!whole) return value;
    const scale = window.devicePixelRatio || 1;
    return Math.round(value * scale) / scale;
  };
  const place = (px: number, py: number) => `translate3d(${snap(px)}px, ${snap(py)}px, 0)`;
  const current = (): CursorFrame => ({ x, y, dotX, dotY, ringX, ringY, snap });

  const commitState = (next: string) => {
    if (next === state) return;
    if (seen) options.onBeforeState?.(next);
    state = next;
    root.dataset.state = next;
  };
  let pendingState: string | null = null;
  let pendingTimer = 0;
  const setState = (next: string) => {
    // The soft cursors wait ~30ms before changing, so passing over small things does not make them flicker.
    if (!instant || !seen) return commitState(next);
    if (next === state) {
      window.clearTimeout(pendingTimer);
      pendingState = null;
      return;
    }
    if (next === pendingState) return;
    pendingState = next;
    window.clearTimeout(pendingTimer);
    pendingTimer = window.setTimeout(() => {
      pendingState = null;
      commitState(next);
    }, 30);
  };

  /** The caret is as tall as the line of text it is over. */
  const syncCaret = (target: EventTarget | null) => {
    if (!(target instanceof Element) || !caret.states.includes(state)) return;
    const size = parseFloat(getComputedStyle(target).fontSize);
    root.style.setProperty("--caret-h", `${Math.min(caret.max, Math.max(caret.min, (size || 16) * caret.ratio)).toFixed(1)}px`);
  };

  const tick = (now: number) => {
    // By the clock, not the frame, so the glide feels the same on a 60 and a 144 Hz screen.
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    const kDot = calm || instant ? 1 : 1 - Math.exp(-DOT_SPEED * dt);
    const kRing = calm ? 1 : 1 - Math.exp(-(instant ? RING_SPEED_INSTANT : RING_SPEED) * dt);
    dotX += (x - dotX) * kDot;
    dotY += (y - dotY) * kDot;
    ringX += (x - ringX) * kRing;
    ringY += (y - ringY) * kRing;
    // The ease only ever approaches the pointer, so close the last pixel: a part left a fraction off
    // centre is drawn blurred and sits visibly crooked around the other.
    if (Math.abs(x - dotX) < 0.5 && Math.abs(y - dotY) < 0.5) {
      dotX = x;
      dotY = y;
    }
    const settled = dotX === x && dotY === y && Math.abs(x - ringX) < 0.5 && Math.abs(y - ringY) < 0.5;
    if (settled) {
      ringX = x;
      ringY = y;
    }
    dot.style.transform = place(dotX, dotY);
    ring.style.transform = ringInsideDot ? place(ringX - dotX, ringY - dotY) : place(ringX, ringY);
    options.onFrame?.(current());
    frame = settled ? 0 : requestAnimationFrame(tick);
  };

  const handleMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    x = event.clientX;
    y = event.clientY;
    if (!seen) {
      seen = true;
      dotX = ringX = x;
      dotY = ringY = y;
      dot.style.transform = place(x, y);
      document.documentElement.classList.add("has-cursor");
      options.onFirstMove?.();
    }
    // No lag: the dot is placed now, not on the next frame, and the ring is offset from it to match.
    if (instant && seen) {
      dotX = x;
      dotY = y;
      dot.style.transform = place(dotX, dotY);
      ring.style.transform = ringInsideDot ? place(ringX - dotX, ringY - dotY) : place(ringX, ringY);
    }
    root.classList.add("is-on");
    setState(stateOf(event.target));
    syncCaret(event.target);
    options.onMove?.(x, y);
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  // Scrolling moves content under a still pointer; look again at what is there.
  // elementFromPoint is a hit test (it can force a layout), so during a fast scroll it runs about ten times a second, not every frame.
  let lastLook = 0;
  const handleScroll = () => {
    if (!seen || scrollFrame) return;
    scrollFrame = requestAnimationFrame((now) => {
      scrollFrame = 0;
      if (now - lastLook < 100) {
        handleScroll();
        return;
      }
      lastLook = now;
      const under = document.elementFromPoint(x, y);
      setState(stateOf(under));
      syncCaret(under);
    });
  };

  const handleDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse") root.classList.add("is-down");
  };
  const handleUp = () => root.classList.remove("is-down");
  const handleLeave = () => {
    root.classList.remove("is-on", "is-down");
    options.onLeave?.();
  };

  window.addEventListener("pointermove", handleMove, { passive: true });
  window.addEventListener("pointerdown", handleDown, { passive: true });
  window.addEventListener("pointerup", handleUp, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("blur", handleLeave);
  document.documentElement.addEventListener("pointerleave", handleLeave);
  return () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(scrollFrame);
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerdown", handleDown);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("blur", handleLeave);
    document.documentElement.removeEventListener("pointerleave", handleLeave);
    document.documentElement.classList.remove("has-cursor");
  };
}

import { useEffect, useRef } from "react";

import { FIELD, GRAB, LINK } from "@/lib/interactive";
import { prefersReducedMotion } from "@/hooks/glitch";
import { ringPosition } from "./ringPosition";

type CursorState = "default" | "link" | "field" | "grab" | "no";

const DISABLED = ':disabled, [aria-disabled="true"]';

function stateOf(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return "default";
  if (target.closest(DISABLED)) return "no";
  if (target.closest(FIELD) || target.closest('pre, code, .terminal-scroll, .selectable, [data-cursor="code"]')) return "field";
  if (target.closest(LINK)) return "link";
  if (target.closest(GRAB)) return "grab";
  return "default";
}

/** The cursor of every style except the original (which has its own, see CustomCursor). It only
 * follows the pointer and says what the pointer is over; how it looks is up to each style's
 * stylesheet, through `data-state` ("default", "link", "field", "grab", "no"), `.is-down` while a
 * button is held, and two parts: `.tc-dot` (exactly at the pointer) and `.tc-ring` (easing behind it).
 * The `.tc-arrow` is a pointer-shaped shape for the styles that draw one. The system cursor is
 * hidden only once a real mouse has moved, so touch and keyboard users never lose it. */
export function ThemeCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!root || !dot || !ring) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    // How fast each part closes on the pointer, per second; the dot follows closely and the ring lazily.
    // Reduced motion follows exactly.
    const calm = prefersReducedMotion();
    const DOT_SPEED = 90;
    const RING_SPEED = 20;

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
    let state: CursorState = "default";

    const setState = (next: CursorState) => {
      if (next === state) return;
      state = next;
      root.dataset.state = next;
    };

    /** The I-beam is as tall as the line of text it is over. */
    const syncCaret = (target: EventTarget | null) => {
      if (!(target instanceof Element) || state !== "field") return;
      const size = parseFloat(getComputedStyle(target).fontSize);
      root.style.setProperty("--caret-h", `${Math.min(30, Math.max(14, (size || 16) * 1.2)).toFixed(1)}px`);
    };

    /** Whole device pixels only. On a scaled screen (125%, 150%) a CSS pixel is a fraction of a device
     * one, and a part drawn between pixels has its edges rounded one way on the left and the other on
     * the right, so the frame sits crooked around the dot depending on where the pointer is. */
    const snap = (value: number) => {
      const scale = window.devicePixelRatio || 1;
      return Math.round(value * scale) / scale;
    };
    const place = (px: number, py: number) => `translate3d(${snap(px)}px, ${snap(py)}px, 0)`;
    const publish = () => {
      ringPosition.x = snap(dotX) + snap(ringX - dotX);
      ringPosition.y = snap(dotY) + snap(ringY - dotY);
      ringPosition.on = true;
    };

    const tick = (now: number) => {
      // By the clock, not the frame, so the glide feels the same on a 60 and a 144 Hz screen.
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const kDot = calm ? 1 : 1 - Math.exp(-DOT_SPEED * dt);
      const kRing = calm ? 1 : 1 - Math.exp(-RING_SPEED * dt);
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
      // The ring rides inside the dot's layer and only trails it by this offset, so at rest the two
      // are drawn from the same origin and cannot be off centre from each other.
      ring.style.transform = place(ringX - dotX, ringY - dotY);
      publish();
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
      }
      root.classList.add("is-on");
      setState(stateOf(event.target));
      syncCaret(event.target);
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    // Scrolling moves content under a still pointer; look again at what is there.
    const handleScroll = () => {
      if (!seen || scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const under = document.elementFromPoint(x, y);
        setState(stateOf(under));
        syncCaret(under);
      });
    };

    const handleDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") root.classList.add("is-down");
    };
    const handleUp = () => root.classList.remove("is-down");
    const handleLeave = () => root.classList.remove("is-on", "is-down");

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
      ringPosition.on = false;
    };
  }, []);

  return (
    <div ref={rootRef} className="theme-cursor" data-state="default" aria-hidden="true">
      <span ref={dotRef} className="tc-pos">
        <span ref={ringRef} className="tc-pos">
          <span className="tc-ring" />
        </span>
        <span className="tc-dot" />
        <svg className="tc-arrow" viewBox="0 0 14 21" focusable="false" shapeRendering="crispEdges">
          <path d="M0 0h2v2h2v2h2v2h2v2h2v2h2v2H8v2h2v2h2v4h-3v-4H7v-2H5v2H3v2H0z" />
        </svg>
        <span className="tc-bar" />
        <svg className="tc-x" viewBox="0 0 20 20" focusable="false">
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </span>
    </div>
  );
}

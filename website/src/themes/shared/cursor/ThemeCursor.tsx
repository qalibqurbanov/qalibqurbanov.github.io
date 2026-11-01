import { useEffect, useRef } from "react";

import { FIELD, GRAB, LINK } from "@/lib/interactive";
import { prefersReducedMotion } from "@/hooks/glitch";

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
    const ease = prefersReducedMotion() ? 1 : 0.18;

    let x = 0;
    let y = 0;
    let ringX = 0;
    let ringY = 0;
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

    const tick = () => {
      ringX += (x - ringX) * ease;
      ringY += (y - ringY) * ease;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      frame = Math.abs(x - ringX) > 0.1 || Math.abs(y - ringY) > 0.1 ? requestAnimationFrame(tick) : 0;
    };

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      if (!seen) {
        seen = true;
        ringX = x;
        ringY = y;
        document.documentElement.classList.add("has-cursor");
      }
      root.classList.add("is-on");
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      setState(stateOf(event.target));
      syncCaret(event.target);
      if (!frame) frame = requestAnimationFrame(tick);
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
    };
  }, []);

  return (
    <div ref={rootRef} className="theme-cursor" data-state="default" aria-hidden="true">
      <span ref={ringRef} className="tc-pos">
        <span className="tc-ring" />
      </span>
      <span ref={dotRef} className="tc-pos">
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

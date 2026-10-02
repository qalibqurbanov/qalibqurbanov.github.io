import { useEffect, useRef } from "react";

type CursorState = "default" | "link" | "field" | "code" | "grab";

const FIELD =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]';
const LINK =
  'a[href], button:not(:disabled), summary, select, label[for], [role="button"], [role="tab"], [role="option"], [role="menuitem"], [role="radio"], [role="checkbox"], .cursor-pointer';
const GRAB = ".cursor-grab, .cursor-grabbing";
const CODE = 'pre, code, .terminal-scroll, .selectable, [data-cursor="code"]';

/** How far the trailing ring closes the gap to the pointer each frame. */
const RING_EASE = 0.2;

function stateOf(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return "default";
  if (target.closest(FIELD)) return "field";
  if (target.closest(LINK)) return "link";
  if (target.closest(GRAB)) return "grab";
  if (target.closest(CODE)) return "code";
  return "default";
}

/** Replaces the system cursor on mouse-like pointers with a dot and a soft
 * trailing ring that change with what is underneath: `[ • ]` brackets over
 * anything clickable, a blinking block caret over code and the terminal, an
 * editor I-beam in text fields, a grip on the draggable window. Position goes
 * straight to transforms (no React state). The system cursor is only hidden
 * once a real mouse has moved, so touch and keyboard users never lose it. */
export function CustomCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!root || !ring || !dot) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const ease = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : RING_EASE;

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
      if (!frame) frame = requestAnimationFrame(tick);
    };

    // Scrolling moves content under a still pointer; re-check what is there.
    const handleScroll = () => {
      if (!seen || scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        setState(stateOf(document.elementFromPoint(x, y)));
      });
    };

    const handleDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") root.classList.add("is-down");
    };
    const handleUp = () => root.classList.remove("is-down");
    const handleLeave = () => {
      root.classList.remove("is-on", "is-down");
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
  }, []);

  return (
    <div ref={rootRef} className="custom-cursor" data-state="default" aria-hidden="true">
      <span ref={ringRef} className="custom-cursor-pos">
        <span className="custom-cursor-ring" />
      </span>
      <span ref={dotRef} className="custom-cursor-pos">
        <span className="custom-cursor-dot" />
      </span>
    </div>
  );
}

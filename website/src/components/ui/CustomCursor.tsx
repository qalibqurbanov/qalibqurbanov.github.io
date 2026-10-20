import { useEffect, useRef } from "react";

import { idleProgress, idleShow, wake } from "@/lib/idle";

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
    // While the visitor is away, the ring fills and the dot turns into a butterfly:
    // the countdown to the butterflies (see lib/idle). Only touched when it changes.
    let idleFrame = 0;
    let lastP = -1;
    let lastShow = -1;
    // What is drawn eases toward what the clock says: it fades in with the
    // countdown, and when the visitor moves again it fades out over about
    // a fifth of a second instead of snapping away (the progress holds its
    // last value while it fades).
    let shown = 0;
    let heldP = 0;
    let tickAt = 0;
    let wasBroken = false;
    const idleTick = (now: number) => {
      const dt = Math.min(0.05, (now - (tickAt || now)) / 1000);
      tickAt = now;
      // While the page is in ruins (the butterfly demolition) the idle cursor stays away;
      // once the site is back the countdown starts afresh.
      const broken = document.documentElement.classList.contains("demolishing");
      if (wasBroken && !broken) wake();
      wasBroken = broken;
      const target = broken ? 0 : idleShow(now);
      shown += (target - shown) * (1 - Math.exp(-(target > shown ? 14 : 12) * dt));
      if (target === 0 && shown < 0.003) shown = 0;
      if (target > 0.01) heldP = idleProgress(now);
      else if (shown === 0) heldP = 0;
      const p = heldP;
      const show = shown;
      if (Math.abs(p - lastP) > 0.002 || Math.abs(show - lastShow) > 0.004) {
        lastP = p;
        lastShow = show;
        root.style.setProperty("--idle-p", p.toFixed(4));
        root.style.setProperty("--idle-show", show.toFixed(3));
        root.classList.toggle("is-idle", show > 0.01);
        root.classList.toggle("is-idle-done", p >= 1);
      }
      idleFrame = requestAnimationFrame(idleTick);
    };

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
        idleFrame = requestAnimationFrame(idleTick);
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
      cancelAnimationFrame(idleFrame);
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
        <span className="custom-cursor-ring">
          <span className="custom-cursor-sweep" />
          <span className="custom-cursor-arc" />
          <span className="custom-cursor-ping" />
        </span>
      </span>
      <span ref={dotRef} className="custom-cursor-pos">
        <span className="custom-cursor-dot" />
        <svg className="custom-cursor-bf" viewBox="0 0 120 120" focusable="false">
          <g className="custom-cursor-bf-wings">
            <g className="custom-cursor-bf-wing">
              <path d="M60 58 C54 34 30 12 12 20 C2 26 8 48 28 56 C40 60 52 60 60 58Z" />
              <path d="M60 64 C52 66 34 68 28 82 C22 98 40 108 51 94 C57 85 60 74 60 64Z" />
            </g>
            <g className="custom-cursor-bf-wing" transform="translate(120 0) scale(-1 1)">
              <path d="M60 58 C54 34 30 12 12 20 C2 26 8 48 28 56 C40 60 52 60 60 58Z" />
              <path d="M60 64 C52 66 34 68 28 82 C22 98 40 108 51 94 C57 85 60 74 60 64Z" />
            </g>
          </g>
          <path className="custom-cursor-bf-body" d="M60 42 C63.5 58 62.5 76 60 91 C57.5 76 56.5 58 60 42Z" />
          <circle className="custom-cursor-bf-head" cx="60" cy="37" r="4.2" />
          <path className="custom-cursor-bf-ant" d="M58.6 34 C55 26 50 21 44 18 M61.4 34 C65 26 70 21 76 18" />
        </svg>
      </span>
    </div>
  );
}

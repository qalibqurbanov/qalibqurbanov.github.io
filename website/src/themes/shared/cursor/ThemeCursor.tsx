import { useEffect, useRef } from "react";

import { FIELD, GRAB, LINK } from "@/lib/interactive";
import { trackCursor } from "@/lib/cursorTracker";
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
    const stop = trackCursor({
      root,
      dot,
      ring,
      stateOf,
      caret: { states: ["field"], min: 14, max: 30, ratio: 1.2 },
      whole: true,
      ringInsideDot: true,
      onFrame: ({ dotX, dotY, ringX, ringY, snap }) => {
        ringPosition.x = snap(dotX) + snap(ringX - dotX);
        ringPosition.y = snap(dotY) + snap(ringY - dotY);
        ringPosition.on = true;
      },
    });
    return () => {
      stop();
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

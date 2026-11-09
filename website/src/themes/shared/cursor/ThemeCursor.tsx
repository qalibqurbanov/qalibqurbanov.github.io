import { useEffect, useRef } from "react";

import { FIELD, GRAB, LINK } from "@/lib/interactive";
import { prefersReducedMotion } from "@/hooks/glitch";
import { trackCursor } from "@/lib/cursorTracker";
import { ringPosition } from "./ringPosition";

/** How light the surface under an element is, 0 (black) to 1 (white): the first background colour found on it or the
 * elements around it. Gradients and images are skipped, and the page's own colour is the last resort. */
function surfaceLight(start: Element | null): number {
  const lum = (c: number[]) => {
    const f = (v: number) => {
      const n = v / 255;
      return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  for (let el: Element | null = start; el; el = el.parentElement) {
    const cs = getComputedStyle(el);
    const m = cs.backgroundColor.match(/[\d.]+/g)?.map(Number);
    if (m && (m[3] ?? 1) > 0.6) return lum(m);
  }
  const m = getComputedStyle(document.documentElement).backgroundColor.match(/[\d.]+/g)?.map(Number);
  return m ? lum(m) : 1;
}

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
      instant: true,
      // The old cursor is left behind as a copy that fades out where it was, while the new one fades in: a crossfade.
      onBeforeState: () => {
        if (prefersReducedMotion() || document.documentElement.getAttribute("data-motion") === "off") return;
        const ghost = root.cloneNode(true) as HTMLElement;
        ghost.classList.add("is-on", "tc-ghost");
        root.after(ghost);
        const fade = ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease-in-out", fill: "forwards" });
        fade.onfinish = () => ghost.remove();
      },
      ringInsideDot: true,
      onFrame: ({ dotX, dotY, ringX, ringY, snap }) => {
        ringPosition.x = snap(dotX) + snap(ringX - dotX);
        ringPosition.y = snap(dotY) + snap(ringY - dotY);
        ringPosition.on = true;
      },
    });
    // Over a dark surface (a black footer) the cursor flips to its light colours, and back over a light one.
    let lastTarget: EventTarget | null = null;
    const watchSurface = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.target === lastTarget) return;
      lastTarget = event.target;
      const dark = surfaceLight(event.target instanceof Element ? event.target : null) < 0.3;
      const next = dark ? "dark" : "light";
      if (root.dataset.bg !== next) root.dataset.bg = next;
    };
    window.addEventListener("pointermove", watchSurface, { passive: true });

    // Switching between cursors (arrow, hand, caret, cross...) is eased: whatever the new state shows pops in from
    // a smaller, fainter size instead of appearing at once.
    const parts = [".tc-arrow", ".tc-dot", ".tc-ring", ".tc-bar", ".tc-x"];
    let seenState = root.dataset.state;
    const morph = new MutationObserver(() => {
      if (root.dataset.state === seenState) return;
      seenState = root.dataset.state;
      if (prefersReducedMotion() || document.documentElement.getAttribute("data-motion") === "off") return;
      for (const selector of parts) {
        const part = root.querySelector<HTMLElement | SVGElement>(selector);
        if (!part || part.getClientRects().length === 0) continue;
        part.animate([{ opacity: 0, scale: "0.82" }, {}], { duration: 260, easing: "cubic-bezier(0.25, 0.8, 0.3, 1)" });
      }
    });
    morph.observe(root, { attributes: true, attributeFilter: ["data-state"] });
    return () => {
      morph.disconnect();
      window.removeEventListener("pointermove", watchSurface);
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

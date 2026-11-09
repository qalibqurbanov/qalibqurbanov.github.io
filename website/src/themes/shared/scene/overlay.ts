import type { SceneEnv } from "./types";

/** A transparent canvas over the whole page (above the content, below the cursor) for effects that must be seen
 * on top of cards and text: a cursor trail, a click burst. It never takes a click. */
export function createOverlay() {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:2147482000;";
  document.body.appendChild(canvas);
  const g = canvas.getContext("2d");
  return {
    /** Sizes the canvas to the viewport, clears it and returns its context, ready to draw in CSS pixels. */
    begin(e: SceneEnv): CanvasRenderingContext2D | null {
      if (!g) return null;
      const w = Math.round(e.w * e.dpr);
      const h = Math.round(e.h * e.dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = `${e.w}px`;
        canvas.style.height = `${e.h}px`;
      }
      g.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
      g.clearRect(0, 0, e.w, e.h);
      return g;
    },
    destroy() {
      canvas.remove();
    },
  };
}

import type { Scene, SceneEnv, SceneFactory } from "./types";

/** What a simple 2D scene is made of: `draw` runs every frame on a cleared canvas that is already scaled to CSS pixels. */
export interface Painter {
  draw(g: CanvasRenderingContext2D, e: SceneEnv): void;
  /** The viewport changed size; rebuild anything cached at the old size. */
  resize?(e: SceneEnv): void;
  press?(x: number, y: number, e: SceneEnv): void;
}

/** Builds a scene factory from a painter: the plumbing every simple style repeats (context, scaling, clearing). */
export function simpleScene(setup: (g: CanvasRenderingContext2D, e: SceneEnv) => Painter): SceneFactory {
  return (canvas, env) => {
    const g = canvas.getContext("2d");
    if (!g) return { frame() {} };
    const painter = setup(g, env);
    const scene: Scene = {
      frame(e) {
        g.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
        g.clearRect(0, 0, e.w, e.h);
        painter.draw(g, e);
      },
      resize: painter.resize ? (e) => painter.resize?.(e) : undefined,
      press: painter.press ? (x, y, e) => painter.press?.(x, y, e) : undefined,
    };
    return scene;
  };
}

/** A cached layer the size of the viewport, redrawn only when the viewport changes. */
export function cachedLayer(paint: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const canvas = document.createElement("canvas");
  let key = "";
  return {
    /** Draws the layer at (x, y), repainting it first when the size (or `stamp`) changed. */
    blit(g: CanvasRenderingContext2D, e: SceneEnv, x = 0, y = 0, stamp = "") {
      const next = `${e.w}x${e.h}@${e.dpr}${stamp}`;
      if (next !== key) {
        key = next;
        canvas.width = Math.max(1, Math.round(e.w * e.dpr));
        canvas.height = Math.max(1, Math.round(e.h * e.dpr));
        const c = canvas.getContext("2d");
        if (c) {
          c.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
          paint(c, e.w, e.h);
        }
      }
      g.drawImage(canvas, x, y, e.w, e.h);
    },
    invalidate() {
      key = "";
    },
  };
}

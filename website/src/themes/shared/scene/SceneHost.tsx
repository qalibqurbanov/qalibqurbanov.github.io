import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/hooks/glitch";
import { subscribeTick } from "@/lib/ticker";
import { useMotion } from "@/motion/context";

import type { SceneEnv, SceneFactory } from "./types";
import { readColor } from "./util";

/** Pixel ratio the scenes are drawn at. */
const MAX_DPR = 1.5;

/** Runs one theme scene on a canvas behind the page: sizes it, follows the pointer and the scroll,
 * keeps the colours current, and starts and stops the frame loop. The scene is created once per
 * mount and destroyed on unmount, so switching theme (or the animation level) leaves nothing
 * running. */
export function SceneHost({ factory }: { factory: SceneFactory }) {
  const { motion } = useMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const objectsRef = useRef<HTMLCanvasElement>(null);
  const modelsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const objects = objectsRef.current;
    const models = modelsRef.current;
    if (!canvas || !objects || !models) return;
    const still = motion === "off" || prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    const env: SceneEnv = {
      w: window.innerWidth,
      h: window.innerHeight,
      dpr,
      t: 0,
      dt: 0.016,
      mx: -1e4,
      my: -1e4,
      rx: -1e4,
      ry: -1e4,
      vx: 0,
      vy: 0,
      seen: false,
      scrollY: window.scrollY,
      scrollMax: 1,
      light: false,
      bg: [8, 5, 21],
      text: [240, 235, 255],
      accent: [177, 133, 255],
      accent2: [216, 180, 254],
      still,
      full: motion === "full",
    };

    const readTheme = () => {
      env.light = document.documentElement.getAttribute("data-theme") === "light";
      env.bg = readColor("--color-bg", env.bg);
      env.text = readColor("--color-text", env.text);
      env.accent = readColor("--color-accent", env.accent);
      env.accent2 = readColor("--color-accent-2", env.accent2);
    };
    readTheme();

    const fit = () => {
      env.w = window.innerWidth;
      env.h = window.innerHeight;
      // The model canvas is sized by the stage that draws on it (three.js sets its own size).
      canvas.width = objects.width = Math.round(env.w * dpr);
      canvas.height = objects.height = Math.round(env.h * dpr);
    };
    fit();

    const scene = factory(canvas, env, objects, models);
    const measureScroll = () => {
      env.scrollY = window.scrollY;
      env.scrollMax = Math.max(1, document.documentElement.scrollHeight - env.h);
    };
    measureScroll();

    let start = performance.now();
    let last = start;
    let dirty = true;
    let frames = 0;

    const draw = (now: number) => {
      env.dt = Math.min(0.064, Math.max(0.001, (now - last) / 1000));
      last = now;
      env.t = (now - start) / 1000;
      if (!still && ++frames % 20 === 0) readTheme();
      // The pointer eases toward where it is; its speed is how far it still has to go.
      if (env.seen) {
        const k = 1 - Math.exp(-env.dt * 14);
        env.mx += (env.rx - env.mx) * k;
        env.my += (env.ry - env.my) * k;
        env.vx += ((env.rx - env.mx) / 0.06 - env.vx) * 0.2;
        env.vy += ((env.ry - env.my) / 0.06 - env.vy) * 0.2;
      }
      measureScroll();
      scene.frame(env);
    };

    const onMove = (event: PointerEvent) => {
      env.rx = event.clientX;
      env.ry = event.clientY;
      if (!env.seen) {
        env.seen = true;
        env.mx = env.rx;
        env.my = env.ry;
      }
      dirty = true;
    };
    const onPress = (event: PointerEvent) => scene.press?.(event.clientX, event.clientY, env);
    const onResize = () => {
      fit();
      scene.resize?.(env);
      dirty = true;
    };
    const onScroll = () => {
      dirty = true;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onPress, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    // A change of colour mode, colour scheme or theme shows up in the next frame.
    const watcher = new MutationObserver(() => {
      readTheme();
      dirty = true;
    });
    watcher.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "data-style"] });

    let stop: () => void;
    if (still) {
      // One frame now, and one more whenever something that changes the picture happens.
      draw(performance.now());
      const id = window.setInterval(() => {
        if (!dirty) return;
        dirty = false;
        draw(performance.now());
      }, 250);
      stop = () => window.clearInterval(id);
    } else {
      stop = subscribeTick(draw, motion === "light" ? 33 : 0);
    }

    return () => {
      stop();
      watcher.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onPress);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      scene.destroy?.();
    };
  }, [factory, motion]);

  return (
    <>
      <canvas ref={canvasRef} className="theme-scene" aria-hidden="true" />
      <canvas ref={objectsRef} className="theme-scene theme-scene-objects" aria-hidden="true" />
      <canvas ref={modelsRef} className="theme-scene theme-scene-models" aria-hidden="true" />
    </>
  );
}

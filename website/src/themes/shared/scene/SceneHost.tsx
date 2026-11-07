import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/hooks/glitch";
import { subscribeTick } from "@/lib/ticker";
import { useMotion } from "@/motion/context";

import type { SceneEnv, SceneFactory } from "./types";
import { readColor } from "./util";

/** Pixel ratio the scenes are drawn at, at most. */
const MAX_DPR = 1.5;
/** The scene is drawn at this share of that on a phone or a machine with few cores, and it steps down
 * from there, to no less than MIN_QUALITY, whenever frames take longer than SLOW_FRAME_MS on average. */
const MIN_QUALITY = 0.5;
const SLOW_FRAME_MS = 26;
const QUALITY_WINDOW = 45;

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
    const maxDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const weak = window.matchMedia("(pointer: coarse)").matches || (navigator.hardwareConcurrency || 8) <= 4;
    let quality = weak ? 0.8 : 1;
    const dpr = maxDpr * quality;

    const env: SceneEnv = {
      w: document.documentElement.clientWidth || window.innerWidth,
      h: document.documentElement.clientHeight || window.innerHeight,
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
      react: false,
      bx: 0,
      by: 0,
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
      // The area the fixed canvases fill, which leaves out the scrollbar: innerWidth is wider than it,
      // so drawing at that size squeezes the picture sideways and puts everything drawn at the pointer
      // off it by more the further right the pointer is.
      env.w = document.documentElement.clientWidth || window.innerWidth;
      env.h = document.documentElement.clientHeight || window.innerHeight;
      env.bx = env.react ? env.mx : env.w / 2;
      env.by = env.react ? env.my : env.h / 2;
      // The model canvas is sized by the stage that draws on it (three.js sets its own size).
      canvas.width = objects.width = Math.round(env.w * env.dpr);
      canvas.height = objects.height = Math.round(env.h * env.dpr);
    };
    fit();

    const scene = factory(canvas, env, objects, models);
    // scrollHeight forces a layout, so it is read again only when the page's size changed, not every frame.
    let heightStale = true;
    const measureScroll = () => {
      env.scrollY = window.scrollY;
      if (heightStale) {
        heightStale = false;
        env.scrollMax = Math.max(1, document.documentElement.scrollHeight - env.h);
      }
    };
    measureScroll();

    let start = performance.now();
    let last = start;
    let dirty = true;
    let frames = 0;

    // Frames that take too long are a sign of a weak GPU: draw the scene at a lower resolution, in steps.
    let slowFrames = 0;
    let slowTotal = 0;
    const watchSpeed = (frameMs: number) => {
      slowTotal += Math.min(frameMs, 100);
      if (++slowFrames < QUALITY_WINDOW) return;
      const average = slowTotal / slowFrames;
      slowFrames = 0;
      slowTotal = 0;
      if (average > SLOW_FRAME_MS && quality > MIN_QUALITY && !document.hidden) {
        quality = Math.max(MIN_QUALITY, quality * 0.8);
        env.dpr = maxDpr * quality;
        onResize();
      }
    };

    const draw = (now: number) => {
      if (!still && now - start > 3000) watchSpeed(now - last);
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
      env.bx = env.react ? env.mx : env.w / 2;
      env.by = env.react ? env.my : env.h / 2;
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
      heightStale = true;
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

    // The scrollbar coming or going (a dialog opens, the page gets shorter) changes the width the canvases
    // fill without any window resize.
    const sizeWatcher = new ResizeObserver(() => {
      heightStale = true;
      if (env.w !== document.documentElement.clientWidth || env.h !== document.documentElement.clientHeight) onResize();
    });
    sizeWatcher.observe(document.documentElement);
    sizeWatcher.observe(document.body);

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
      // Not drawn while a dialog covers the page: it hides the scene, and the scene is the costliest thing running.
      stop = subscribeTick(draw, motion === "light" ? 33 : 0, true);
    }

    return () => {
      stop();
      watcher.disconnect();
      sizeWatcher.disconnect();
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

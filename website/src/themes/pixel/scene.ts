import { simpleScene } from "../shared/scene/simple";
import type { SceneFactory } from "../shared/scene/types";
import { mix, seeded } from "../shared/scene/util";
import { createStage } from "../shared/scene/stage";
import { createWorld } from "../shared/scene/world";
import { pixelModels } from "./models";
import { createCursorFx } from "./cursorFx";
import { kinds } from "./objects";

/** A 16-bit landscape drawn on a canvas a fifth the size and scaled up without smoothing, so every
 * pixel is a chunky square: a sky with drifting block clouds and twinkling stars, and three rows of hills
 * that scroll sideways at different speeds, faster when the page is scrolled. */
const PIXEL = 5;

const hex = (c: [number, number, number]) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

const backdrop = simpleScene(() => {
  const small = document.createElement("canvas");
  const rnd = seeded(7);
  const stars = Array.from({ length: 60 }, () => ({ x: rnd(), y: rnd() * 0.6, p: rnd() * 6 }));
  const clouds = Array.from({ length: 6 }, () => ({ x: rnd(), y: 0.1 + rnd() * 0.35, w: 9 + Math.floor(rnd() * 8), v: 0.4 + rnd() * 0.6 }));

  return {
    draw(g, e) {
      const w = Math.ceil(e.w / PIXEL);
      const h = Math.ceil(e.h / PIXEL);
      if (small.width !== w || small.height !== h) {
        small.width = w;
        small.height = h;
      }
      const s = small.getContext("2d");
      if (!s) return;
      s.clearRect(0, 0, w, h);
      const dark = !e.light;
      // stars at night
      if (dark) {
        for (const st of stars) {
          if (Math.sin(e.t * 2 + st.p) > -0.2) {
            s.fillStyle = hex(e.text);
            s.globalAlpha = 0.7;
            s.fillRect(Math.floor(st.x * w), Math.floor(st.y * h), 1, 1);
          }
        }
        s.globalAlpha = 1;
      }
      // block clouds
      s.fillStyle = hex(mix(e.bg, e.text, dark ? 0.12 : 0.85));
      for (const c of clouds) {
        const x = Math.floor(((c.x * w + e.t * c.v * 2 + e.scrollY * 0.01) % (w + 30)) - 15);
        const y = Math.floor(c.y * h);
        s.fillRect(x + 2, y, c.w - 4, 1);
        s.fillRect(x, y + 1, c.w, 2);
        s.fillRect(x + 3, y - 1, Math.floor(c.w / 2), 1);
      }
      // three rows of hills, each a stepped skyline of columns
      const layers = [
        { base: 0.74, amp: 5, freq: 0.045, speed: 3, col: mix(e.bg, e.accent2, 0.22) },
        { base: 0.82, amp: 6, freq: 0.07, speed: 7, col: mix(e.bg, e.accent2, 0.4) },
        { base: 0.92, amp: 4, freq: 0.11, speed: 14, col: mix(e.bg, e.accent2, 0.62) },
      ];
      layers.forEach((l, i) => {
        s.fillStyle = hex(l.col);
        const shift = e.t * l.speed + e.scrollY * 0.02 * (i + 1);
        for (let x = 0; x < w; x++) {
          const a = x + shift;
          const top = Math.floor(l.base * h - l.amp * (Math.sin(a * l.freq) + 0.5 * Math.sin(a * l.freq * 2.3 + i)));
          s.fillRect(x, top, 1, h - top);
        }
      });
      g.imageSmoothingEnabled = false;
      g.drawImage(small, 0, 0, w * PIXEL, h * PIXEL);
    },
  };
});

/** The landscape, with a page-long scatter of game objects (coins, hearts, a chest, slimes...) standing in it. */
export const createScene: SceneFactory = (canvas, env, objects, models) => {
  const base = backdrop(canvas, env, objects, models);
  const fx = objects.getContext("2d");
  const cursorFx = createCursorFx();
  const stage = createStage(models, env, { key: 0xfff0c8, fill: 0x8fd3ff, sky: 0xcfe8ff, ground: 0x2a1b52, exposure: 1.1 });
  const world = createWorld([...kinds, ...pixelModels(() => stage)], { perScreen: 3.4, veil: 0.28 });
  return {
    frame(e) {
      base.frame(e);
      if (fx) world.frame(fx, e);
      stage?.render(e);
      cursorFx.frame(e);
    },
    // A dialog covers the page and the scene stops, but the cursor's effects are drawn above the dialog and go on.
    covered: (e) => cursorFx.frame(e),
    press: (x, y, e) => cursorFx.press(x, y, e),
    resize: (e) => {
      stage?.resize(e);
      world.relayout(e);
    },
    destroy: () => {
      world.destroy();
      stage?.destroy();
      cursorFx.destroy();
    },
  };
};

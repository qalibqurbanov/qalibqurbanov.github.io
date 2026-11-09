import { cachedLayer, simpleScene } from "../shared/scene/simple";
import type { SceneFactory } from "../shared/scene/types";
import { createWorld } from "../shared/scene/world";
import { createCursorFx } from "./cursorFx";
import { kinds } from "./objects";
import { rgba, seeded } from "../shared/scene/util";

/** Flat shapes with hard black outlines and offset shadows (a square, a circle, a triangle, a bar),
 * drifting and turning slowly at different depths, over a halftone dot grid. */
const backdrop = simpleScene(() => {
  const rnd = seeded(66);
  const shapes = Array.from({ length: 8 }, (_, i) => ({ x: rnd(), y: rnd(), s: 60 + rnd() * 120, kind: i % 4, v: 0.02 + rnd() * 0.05, spin: (rnd() - 0.5) * 0.2, d: 0.05 + rnd() * 0.15 }));
  const dots = cachedLayer((c, w, h) => {
    c.fillStyle = "rgba(0,0,0,0.12)";
    for (let y = 8; y < h; y += 16) for (let x = 8 + ((y / 16) % 2 ? 8 : 0); x < w; x += 16) c.fillRect(x, y, 2, 2);
  });

  return {
    draw(g, e) {
      dots.blit(g, e);
      g.lineWidth = 4;
      shapes.forEach((s, i) => {
        const x = s.x * e.w + Math.sin(e.t * s.v * 3 + i) * 30;
        const y = ((s.y * (e.h + 200) - e.scrollY * s.d) % (e.h + 200)) - 100;
        g.save();
        g.translate(x, y);
        g.rotate(e.t * s.spin + i);
        const col = i % 2 ? e.accent : e.accent2;
        for (const pass of [0, 1]) {
          g.save();
          if (pass === 0) g.translate(8, 8);
          g.beginPath();
          if (s.kind === 0) g.rect(-s.s / 2, -s.s / 2, s.s, s.s);
          else if (s.kind === 1) g.arc(0, 0, s.s / 2, 0, 6.2832);
          else if (s.kind === 2) {
            g.moveTo(0, -s.s / 2);
            g.lineTo(s.s / 2, s.s / 2);
            g.lineTo(-s.s / 2, s.s / 2);
            g.closePath();
          } else g.rect(-s.s, -s.s / 6, s.s * 2, s.s / 3);
          g.fillStyle = pass === 0 ? rgba(e.text, 1) : rgba(col, 0.95);
          g.fill();
          if (pass === 1) {
            g.strokeStyle = rgba(e.text, 1);
            g.stroke();
          }
          g.restore();
        }
        g.restore();
      });
    },
  };
});

/** The halftone ground, with a page-long scatter of stickers, stamps, tape, bursts and arrows pasted on it. */
export const createScene: SceneFactory = (canvas, env, objects, models) => {
  const base = backdrop(canvas, env, objects, models);
  const fx = objects.getContext("2d");
  const cursorFx = createCursorFx();
  const world = createWorld(kinds, { perScreen: 3, veil: 0.4 });
  return {
    frame(e) {
      base.frame(e);
      if (fx) world.frame(fx, e);
      cursorFx.frame(e);
    },
    press: (x, y, e) => cursorFx.press(x, y, e),
    resize: (e) => {
      world.relayout(e);
    },
    destroy: () => {
      world.destroy();
      cursorFx.destroy();
    },
  };
};

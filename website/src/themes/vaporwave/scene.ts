import type { Rgb, SceneEnv, SceneFactory } from "../shared/scene/types";
import { makeLayer, mix, rgba } from "../shared/scene/util";
import { createWorld } from "../shared/scene/world";
import { createStage } from "../shared/scene/stage";
import { kinds } from "./objects";
import { vaporModels } from "./models";

const SUN_TOP: Rgb = [255, 251, 150];

interface Cell {
  x: number;
  y: number;
  t: number;
}

/** A pastel dusk with a striped sun, a checkered floor running to the horizon, and a page-long
 * scatter of marble columns, arches, plinths and solids. The cursor leaves a trail of square pixels
 * on an 8px grid, which fade out in steps. */
export const createScene: SceneFactory = (canvas, env0, objects, models) => {
  const g = canvas.getContext("2d");
  const fx = objects.getContext("2d");
  if (!g) return { frame() {} };
  const stage = createStage(models, env0, { key: 0xffc4ea, fill: 0x66e0ff, sky: 0xffd6f2, ground: 0x2a1450, exposure: 1.05 });
  let latest = env0;
  const css = (c: number[]) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  const world = createWorld([...kinds, ...vaporModels(() => stage, () => ({ accent: css(latest.accent), accent2: css(latest.accent2) }))], { perScreen: 3, veil: 0.34 });
  const [sunLayer, sunG] = makeLayer(520, 520);
  const trail: Cell[] = [];
  let lastCell = "";

  function drawSun(e: SceneEnv, cx: number, cy: number, r: number) {
    const s = sunLayer.width;
    sunG.clearRect(0, 0, s, s);
    const grad = sunG.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0, rgba(SUN_TOP, 1));
    grad.addColorStop(0.45, rgba(e.accent, 1));
    grad.addColorStop(1, rgba(mix(e.accent, [120, 70, 220], 0.6), 1));
    sunG.fillStyle = grad;
    sunG.beginPath();
    sunG.arc(s / 2, s / 2, s / 2 - 4, 0, 6.2832);
    sunG.fill();
    sunG.globalCompositeOperation = "destination-out";
    const drift = (e.t * 14) % 44;
    for (let i = -1; i < 14; i++) {
      const y = s * 0.42 + i * 44 + drift;
      const th = Math.max(0, (y - s * 0.42) / s) * 34 + 2;
      if (y > s * 0.4) sunG.fillRect(0, y, s, th);
    }
    sunG.globalCompositeOperation = "source-over";
    g!.save();
    g!.globalAlpha = e.light ? 0.85 : 1;
    const halo = g!.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 2.2);
    halo.addColorStop(0, rgba(e.accent, e.light ? 0.3 : 0.4));
    halo.addColorStop(1, rgba(e.accent, 0));
    g!.fillStyle = halo;
    g!.fillRect(cx - r * 2.3, cy - r * 2.3, r * 4.6, r * 4.6);
    g!.drawImage(sunLayer, cx - r, cy - r, r * 2, r * 2);
    g!.restore();
  }

  function drawFloor(e: SceneEnv, horizon: number) {
    const h = e.h - horizon;
    const light = e.light;
    const floor = g!.createLinearGradient(0, horizon, 0, e.h);
    floor.addColorStop(0, rgba(light ? [255, 205, 240] : [60, 20, 110], light ? 0.55 : 0.9));
    floor.addColorStop(1, rgba(light ? [255, 230, 250] : [20, 8, 55], light ? 0.7 : 0.95));
    g!.fillStyle = floor;
    g!.fillRect(0, horizon, e.w, h);
    const vx = e.w / 2 - (e.mx - e.w / 2) * 0.04;
    const speed = 0.12 + Math.min(0.5, Math.abs(e.vy) / 4000);
    const phase = (e.t * speed + e.scrollY * 0.0009) % 1;
    g!.lineWidth = 1.2;
    for (let i = 0; i < 16; i++) {
      const z = (i + phase) / 16;
      const y = horizon + h * Math.pow(z, 2.1);
      g!.strokeStyle = rgba(light ? e.accent : e.accent2, (0.12 + z * 0.55) * (light ? 0.8 : 1));
      g!.beginPath();
      g!.moveTo(0, y);
      g!.lineTo(e.w, y);
      g!.stroke();
    }
    for (let i = -16; i <= 16; i++) {
      const bx = vx + i * (e.w / 9);
      g!.strokeStyle = rgba(light ? e.accent : e.accent, 0.4);
      g!.beginPath();
      g!.moveTo(vx + i * 6, horizon);
      g!.lineTo(bx + (bx - vx) * 1.6, e.h);
      g!.stroke();
    }
    const glow = g!.createLinearGradient(0, horizon - 40, 0, horizon + 30);
    glow.addColorStop(0, rgba(e.accent2, 0));
    glow.addColorStop(0.55, rgba(light ? e.accent : e.accent2, light ? 0.5 : 0.55));
    glow.addColorStop(1, rgba(e.accent, 0));
    g!.fillStyle = glow;
    g!.fillRect(0, horizon - 40, e.w, 70);
  }

  function frame(e: SceneEnv) {
    latest = e;
    g!.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
    g!.clearRect(0, 0, e.w, e.h);
    const light = e.light;
    const horizon = e.h * 0.62 - Math.min(e.scrollY * 0.03, 30);

    const sky = g!.createLinearGradient(0, 0, 0, horizon);
    if (light) {
      sky.addColorStop(0, rgba([255, 214, 244], 0.7));
      sky.addColorStop(0.6, rgba([255, 190, 232], 0.55));
      sky.addColorStop(1, rgba([200, 230, 255], 0.7));
    } else {
      sky.addColorStop(0, rgba([30, 12, 70], 0.6));
      sky.addColorStop(0.55, rgba([110, 30, 140], 0.5));
      sky.addColorStop(1, rgba(mix(e.accent, [60, 0, 90], 0.3), 0.4));
    }
    g!.fillStyle = sky;
    g!.fillRect(0, 0, e.w, horizon);

    const r = Math.min(e.w, e.h) * 0.27;
    drawSun(e, e.w * 0.5 - (e.mx - e.w / 2) * 0.015, horizon - r * 0.55 + Math.sin(e.t * 0.4) * 5, r);
    drawFloor(e, horizon);

    if (fx) {
      world.frame(fx, e);
      world.veil(g, e, 0.5);
      stage?.render(e);
      // the cursor's trail: square pixels on an 8px grid, dropping out one step at a time
      if (e.seen && !e.still) {
        const cx = Math.floor(e.mx / 8) * 8;
        const cy = Math.floor(e.my / 8) * 8;
        const key = `${cx},${cy}`;
        if (key !== lastCell) {
          trail.push({ x: cx, y: cy, t: e.t });
          lastCell = key;
        }
      }
      while (trail.length && e.t - trail[0].t > 0.8) trail.shift();
      for (const c of trail) {
        const age = (e.t - c.t) / 0.8;
        const step = Math.floor(age * 5) / 5;
        const size = 8 * (1 - step * 0.8);
        fx.fillStyle = rgba(age < 0.5 ? e.accent2 : e.accent, (1 - step) * 0.7);
        fx.fillRect(c.x + (8 - size) / 2, c.y + (8 - size) / 2, size, size);
      }
    }
  }

  return {
    frame,
    resize: (e) => {
      stage?.resize(e);
      world.relayout(e);
    },
    destroy: () => {
      world.destroy();
      stage?.destroy();
    },
  };
};

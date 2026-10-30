import type { Rgb, SceneEnv } from "../shared/scene/types";
import { makeLayer, mix, rgba } from "../shared/scene/util";

const HOT: Rgb = [255, 42, 157];
const CYAN: Rgb = [34, 229, 255];
const AMBER: Rgb = [255, 190, 110];

interface Tower {
  sprite: HTMLCanvasElement;
  x: number;
  w: number;
  h: number;
  layer: 0 | 1;
  beacon: boolean;
}

/** One tower, built the way a real one is: a podium, a stepped shaft whose tiers set back, a curtain
 * wall of glass with a regular grid of floors and bays (a minority of them lit), vertical mullions, a
 * crown with plant, a mast and a neon trim along one edge. Drawn once to a sprite. */
function buildTower(rnd: () => number, w: number, h: number, accent: Rgb, kind: "block" | "needle" | "ring"): HTMLCanvasElement {
  const [c, g] = makeLayer(w + 24, h + 40);
  const left = 12;
  const base = h + 38;
  const tiers = kind === "block" ? [[1, 0.55], [0.82, 0.25], [0.6, 0.14]] : kind === "needle" ? [[0.7, 0.62], [0.4, 0.3]] : [[0.62, 0.7]];
  let y = base;
  for (let ti = 0; ti < tiers.length; ti++) {
    const [tw, th] = tiers[ti];
    const bw = w * tw;
    const bh = h * th;
    const x0 = left + (w - bw) / 2;
    const top = y - bh;
    // the glass: darker toward the base, with a bright sky reflection high up
    const glass = g.createLinearGradient(0, top, 0, y);
    glass.addColorStop(0, rgba(mix([40, 24, 80], accent, 0.18), 1));
    glass.addColorStop(0.5, rgba([16, 8, 38], 1));
    glass.addColorStop(1, rgba([8, 4, 22], 1));
    g.fillStyle = glass;
    g.fillRect(x0, top, bw, bh);
    // floors and bays
    const bay = 5;
    const floor = 6;
    for (let fy = top + 3; fy < y - 3; fy += floor) {
      for (let fx = x0 + 3; fx < x0 + bw - 3; fx += bay) {
        const r = rnd();
        if (r < 0.34) continue;
        const tone: Rgb = r > 0.93 ? CYAN : r > 0.8 ? HOT : AMBER;
        g.fillStyle = rgba(mix(tone, [255, 255, 255], 0.2), 0.5 + rnd() * 0.4);
        g.fillRect(fx, fy, bay - 2, floor - 3);
      }
    }
    // mullions and spandrels
    g.fillStyle = rgba([60, 40, 100], 0.45);
    for (let fx = x0 + 3 - 1; fx < x0 + bw; fx += bay * 4) g.fillRect(fx, top, 1, bh);
    // the edge catches the neon
    g.fillStyle = rgba(accent, 0.85);
    g.fillRect(x0 + bw - 1.4, top, 1.4, bh);
    g.fillStyle = rgba(mix(accent, [255, 255, 255], 0.5), 0.9);
    g.fillRect(x0, top, bw, 1.2);
    y = top;
  }
  const topW = w * tiers[tiers.length - 1][0];
  const cx = left + w / 2;
  // crown: plant boxes and a mast
  g.fillStyle = rgba([30, 20, 56], 1);
  g.fillRect(cx - topW * 0.28, y - 6, topW * 0.56, 6);
  g.fillRect(cx - topW * 0.12, y - 11, topW * 0.2, 5);
  g.strokeStyle = rgba([70, 50, 110], 1);
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(cx, y - 11);
  g.lineTo(cx, y - 11 - h * (kind === "needle" ? 0.28 : 0.12));
  g.stroke();
  if (kind === "ring") {
    // an observation ring around the shaft
    const ry = base - h * 0.52;
    g.strokeStyle = rgba(CYAN, 0.9);
    g.lineWidth = 1.6;
    g.beginPath();
    g.ellipse(cx, ry, w * 0.62, w * 0.14, 0, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = rgba(CYAN, 0.15);
    g.fill();
  }
  return c;
}

/** A skyline of towers on the horizon in two layers: a hazy far layer, a clearer near one, with a
 * needle tower and a ring tower as landmarks. The layout is new each time. */
export function createSkyline(rnd: () => number, accent: Rgb) {
  const towers: Tower[] = [];
  for (let layer = 0 as 0 | 1; layer <= 1; layer = (layer + 1) as 0 | 1) {
    let x = 0;
    while (x < 1) {
      const w = (layer === 0 ? 26 : 38) + rnd() * (layer === 0 ? 30 : 46);
      const h = (layer === 0 ? 70 : 110) + rnd() * (layer === 0 ? 120 : 190);
      const kind = layer === 1 && rnd() < 0.1 ? (rnd() < 0.5 ? "needle" : "ring") : "block";
      towers.push({ sprite: buildTower(rnd, w, h, rnd() < 0.5 ? HOT : accent, kind), x, w, h, layer, beacon: rnd() < 0.3 });
      x += (w * (layer === 0 ? 0.55 : 0.72)) / 1100 + rnd() * 0.004;
      if (layer === 1 && towers.length > 400) break;
    }
    if (layer === 1) break;
  }
  return {
    draw(g: CanvasRenderingContext2D, e: SceneEnv, horizon: number) {
      const span = e.w * 0.66;
      const start = e.w * 0.17;
      for (const t of towers) {
        const centre = Math.abs(t.x - 0.5) * 2;
        // the city is tallest in the middle and falls away to both sides
        const fall = 0.3 + 0.7 * (1 - centre * centre);
        const sx = start + t.x * span - (e.mx - e.w / 2) * (t.layer ? 0.012 : 0.006);
        const hh = (t.h + 40) * fall;
        const ww = (t.w + 24) * (0.55 + fall * 0.45);
        g.save();
        g.globalAlpha = t.layer === 0 ? 0.55 : 0.96;
        g.drawImage(t.sprite, sx, horizon + 2 - hh, ww, hh);
        g.restore();
        if (t.beacon && t.layer === 1) {
          const beat = 0.5 + 0.5 * Math.sin(e.t * 1.2 + t.x * 40);
          g.fillStyle = rgba(HOT, 0.3 + beat * 0.7);
          g.beginPath();
          g.arc(sx + ww / 2, horizon + 2 - hh - 2, 1.6, 0, Math.PI * 2);
          g.fill();
        }
      }
      // a haze at the base of the city where the horizon glows
      const haze = g.createLinearGradient(0, horizon - 90, 0, horizon + 6);
      haze.addColorStop(0, rgba(HOT, 0));
      haze.addColorStop(1, rgba(HOT, e.light ? 0.3 : 0.42));
      g.fillStyle = haze;
      g.fillRect(start - 20, horizon - 90, span + 40, 96);
    },
  };
}

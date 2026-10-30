import type { SceneEnv } from "../shared/scene/types";
import { noise2 } from "../shared/scene/util";
import type { Kind } from "../shared/scene/world";
import { machined } from "./machined";

const TAU = Math.PI * 2;

/** Paints a studio's reflection inside the current clip: a dark floor, a bright horizon line, a sky that
 * brightens upward and two soft boxes. `lx`, `ly` (-1 to 1) slide the whole reflection, which is what
 * makes a metal surface look like it is catching the light as it moves or as the viewer does. */
function paintEnvironment(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, lx: number, ly: number, a: number, light: boolean) {
  const horizon = cy + ly * r * 0.5;
  const dark = light ? 80 : 10;
  const sky = g.createLinearGradient(0, cy - r, 0, horizon);
  sky.addColorStop(0, `rgba(${light ? 255 : 210},${light ? 255 : 218},${light ? 255 : 232},${a})`);
  sky.addColorStop(1, `rgba(${light ? 150 : 60},${light ? 158 : 66},${light ? 172 : 80},${a})`);
  g.fillStyle = sky;
  g.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, horizon - (cy - r * 1.2));
  const floor = g.createLinearGradient(0, horizon, 0, cy + r);
  floor.addColorStop(0, `rgba(${dark + 30},${dark + 32},${dark + 38},${a})`);
  floor.addColorStop(1, `rgba(${dark},${dark + 2},${dark + 6},${a})`);
  g.fillStyle = floor;
  g.fillRect(cx - r * 1.2, horizon, r * 2.4, cy + r * 1.2 - horizon);
  // the horizon: a thin, hard, bright line
  g.fillStyle = `rgba(255,255,255,${a * 0.6})`;
  g.fillRect(cx - r * 1.2, horizon - r * 0.018, r * 2.4, r * 0.036);
  // two soft boxes
  const box = (bx: number, by: number, bw: number, bh: number, alpha: number) => {
    const grad = g.createLinearGradient(bx, by, bx + bw, by + bh);
    grad.addColorStop(0, `rgba(255,255,255,${a * alpha})`);
    grad.addColorStop(1, `rgba(220,230,255,${a * alpha * 0.6})`);
    g.fillStyle = grad;
    g.beginPath();
    g.roundRect(bx, by, bw, bh, r * 0.05);
    g.fill();
  };
  box(cx - r * 0.7 + lx * r * 0.5, cy - r * 0.75 + ly * r * 0.2, r * 0.5, r * 0.3, 0.95);
  box(cx + r * 0.3 + lx * r * 0.5, cy - r * 0.5 + ly * r * 0.2, r * 0.1, r * 0.5, 0.4);
}

interface Light {
  lx: number;
  ly: number;
}

/** The light direction a surface at (x, y) sees: it drifts on its own and leans toward the cursor. */
function lightAt(e: SceneEnv, x: number, y: number, ph: number, state: Light) {
  const tx = Math.sin(e.t * 0.12 + ph) * 0.35 + (e.seen ? ((e.mx - x) / e.w) * 1.3 : 0);
  const ty = Math.cos(e.t * 0.1 + ph) * 0.2 + (e.seen ? ((e.my - y) / e.h) * 1.0 : 0);
  const k = Math.min(1, e.dt * 3);
  state.lx += (Math.max(-1, Math.min(1, tx)) - state.lx) * k;
  state.ly += (Math.max(-1, Math.min(1, ty)) - state.ly) * k;
}

// ---------------------------------------------------------------------------------------------
// Chrome sphere: a mirror ball. The studio reflection is bent by its curvature, slides as the light
// moves, and the sphere floats on a slow bob over a soft contact shadow.
// ---------------------------------------------------------------------------------------------

interface Sphere extends Light {
  ph: number;
}

const sphere: Kind<Sphere> = {
  id: "sphere",
  weight: 2.8,
  radius: [46, 110],
  depth: [0.7, 1],
  reach: 1.5,
  make: (rnd) => ({ ph: rnd() * TAU, lx: 0, ly: 0 }),
  update(s, e, x, y) {
    lightAt(e, x, y, s.ph, s);
  },
  draw(g, s, e, x, y, r, a) {
    const bob = Math.sin(e.t * 0.35 + s.ph) * r * 0.07;
    const cy = y + bob;
    // contact shadow, tighter when it is up
    g.fillStyle = `rgba(0,0,0,${a * (e.light ? 0.16 : 0.38)})`;
    g.beginPath();
    g.ellipse(x, y + r * 1.25, r * (0.75 - bob / r * 0.6), r * 0.13, 0, 0, TAU);
    g.fill();
    g.save();
    g.beginPath();
    g.arc(x, cy, r, 0, TAU);
    g.clip();
    paintEnvironment(g, x, cy, r, s.lx, s.ly, a, e.light);
    // the sphere bends the reflection toward its edge: darken and cool the rim
    const edge = g.createRadialGradient(x, cy, r * 0.45, x, cy, r);
    edge.addColorStop(0, "rgba(0,0,0,0)");
    edge.addColorStop(0.8, `rgba(8,10,16,${a * 0.28})`);
    edge.addColorStop(1, `rgba(4,6,12,${a * 0.78})`);
    g.fillStyle = edge;
    g.fillRect(x - r, cy - r, r * 2, r * 2);
    g.restore();
    g.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(x, cy, r, 0, TAU);
    g.stroke();
    // the specular point
    g.fillStyle = `rgba(255,255,255,${a * 0.95})`;
    g.beginPath();
    g.ellipse(x - r * 0.4 + s.lx * r * 0.2, cy - r * 0.45 + s.ly * r * 0.1, r * 0.09, r * 0.05, -0.6, 0, TAU);
    g.fill();
  },
};

// ---------------------------------------------------------------------------------------------
// Torus: a polished ring tipped toward the viewer and turning slowly. Its surface is a conic sweep of
// dark and bright bands, so as it turns the reflections travel around it.
// ---------------------------------------------------------------------------------------------

interface Torus {
  rot: number;
  spin: number;
  tilt: number;
  ph: number;
}

const torus: Kind<Torus> = {
  id: "torus",
  weight: 1.6,
  radius: [50, 110],
  depth: [0.7, 1],
  reach: 1.4,
  make: (rnd) => ({ rot: rnd() * TAU, spin: (0.1 + rnd() * 0.12) * (rnd() < 0.5 ? -1 : 1), tilt: 0.35 + rnd() * 0.6, ph: rnd() * TAU }),
  update(t, e, x, y) {
    t.rot += t.spin * e.dt;
    // the cursor tips it
    if (e.seen) {
      const k = Math.min(1, e.dt * 2);
      t.tilt += ((0.45 + Math.min(0.5, Math.abs(e.my - y) / e.h)) - t.tilt) * k * 0.2;
    }
  },
  draw(g, t, e, x, y, r, a) {
    g.save();
    g.translate(x, y);
    g.rotate(Math.sin(e.t * 0.12 + t.ph) * 0.1 + t.ph);
    g.scale(1, Math.max(0.2, Math.cos(t.tilt)));
    const grad = g.createConicGradient(t.rot, 0, 0);
    const stops: [number, string][] = [
      [0, `rgba(240,246,255,${a})`],
      [0.12, `rgba(60,66,80,${a})`],
      [0.27, `rgba(250,252,255,${a})`],
      [0.4, `rgba(20,24,32,${a})`],
      [0.55, `rgba(200,210,228,${a})`],
      [0.7, `rgba(34,40,52,${a})`],
      [0.85, `rgba(232,238,250,${a})`],
      [1, `rgba(240,246,255,${a})`],
    ];
    for (const [o, c] of stops) grad.addColorStop(o, c);
    g.strokeStyle = grad;
    g.lineWidth = r * 0.34;
    g.beginPath();
    g.arc(0, 0, r * 0.82, 0, TAU);
    g.stroke();
    g.strokeStyle = `rgba(255,255,255,${a * 0.55})`;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(0, 0, r * 0.82 + r * 0.17, 0, TAU);
    g.stroke();
    g.strokeStyle = `rgba(0,0,0,${a * 0.45})`;
    g.beginPath();
    g.arc(0, 0, r * 0.82 - r * 0.17, 0, TAU);
    g.stroke();
    g.restore();
  },
};

// ---------------------------------------------------------------------------------------------
// Liquid blob: a drop of mercury whose outline keeps changing as slow waves move through it. It
// bulges toward the cursor, and its surface reflects the same studio as the spheres.
// ---------------------------------------------------------------------------------------------

interface Blob extends Light {
  ph: number;
  seed: number;
  pull: number;
  px: number;
  py: number;
}

const blob: Kind<Blob> = {
  id: "mercury",
  weight: 1.6,
  radius: [54, 120],
  depth: [0.7, 1],
  reach: 1.5,
  make: (rnd) => ({ ph: rnd() * TAU, seed: rnd() * 100, lx: 0, ly: 0, pull: 0, px: 0, py: 0 }),
  update(b, e, x, y, r) {
    lightAt(e, x, y, b.ph, b);
    let tx = 0;
    let ty = 0;
    let pull = 0;
    if (e.seen) {
      const dx = e.mx - x;
      const dy = e.my - y;
      const d = Math.hypot(dx, dy);
      if (d < r * 3.2 && d > 1) {
        pull = 1 - d / (r * 3.2);
        tx = dx / d;
        ty = dy / d;
      }
    }
    b.pull += (pull - b.pull) * Math.min(1, e.dt * 3);
    b.px += (tx - b.px) * Math.min(1, e.dt * 3);
    b.py += (ty - b.py) * Math.min(1, e.dt * 3);
  },
  draw(g, b, e, x, y, r, a) {
    const N = 18;
    const pts: [number, number][] = [];
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * TAU;
      const wobble = (noise2(Math.cos(ang) * 1.4 + b.seed + e.t * 0.12, Math.sin(ang) * 1.4 + b.seed) - 0.5) * 0.55;
      const toward = Math.max(0, Math.cos(ang) * b.px + Math.sin(ang) * b.py) * b.pull * 0.45;
      const rad = r * (0.86 + wobble + toward);
      pts.push([x + Math.cos(ang) * rad, y + Math.sin(ang) * rad]);
    }
    const path = () => {
      g.beginPath();
      const mid = (p: [number, number], q: [number, number]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const start = mid(pts[N - 1], pts[0]);
      g.moveTo(start[0], start[1]);
      for (let i = 0; i < N; i++) {
        const m = mid(pts[i], pts[(i + 1) % N]);
        g.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
      }
      g.closePath();
    };
    g.save();
    path();
    g.clip();
    paintEnvironment(g, x, y, r * 1.05, b.lx, b.ly, a, e.light);
    const shade = g.createRadialGradient(x, y, r * 0.3, x, y, r * 1.0);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, `rgba(4,6,12,${a * 0.55})`);
    g.fillStyle = shade;
    g.fillRect(x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
    g.restore();
    path();
    g.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
    g.lineWidth = 1;
    g.stroke();
  },
};

export const kinds: Kind[] = [sphere, torus, blob, ...machined] as Kind[];

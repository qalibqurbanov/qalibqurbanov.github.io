import { CUBE, OCTAHEDRON, project, visibleFaces, type Solid } from "../shared/scene/geometry";
import type { Rgb } from "../shared/scene/types";
import { mix, rgba } from "../shared/scene/util";
import type { Kind } from "../shared/scene/world";
import { more } from "./more";

const TAU = Math.PI * 2;

const marble = (e: { light: boolean; text: Rgb }): Rgb => (e.light ? [236, 226, 244] : [232, 224, 246]);

// ---------------------------------------------------------------------------------------------
// Doric column: fluted marble shaft with a capital and a plinth, snapped off at the top. It hangs in
// the air, tilting and rising a little, with two loose fragments circling the break. It leans away
// from the cursor.
// ---------------------------------------------------------------------------------------------

interface Column {
  ph: number;
  tilt: number;
  jag: number[];
  frag: { a: number; d: number; s: number; sp: number }[];
  lean: number;
}

const column: Kind<Column> = {
  id: "column",
  weight: 3,
  radius: [60, 120],
  depth: [0.7, 1],
  zone: "side",
  reach: 1.6,
  make: (rnd) => ({
    ph: rnd() * TAU,
    tilt: (rnd() - 0.5) * 0.35,
    jag: Array.from({ length: 7 }, () => rnd()),
    frag: Array.from({ length: 2 }, () => ({ a: rnd() * TAU, d: 0.5 + rnd() * 0.4, s: 0.08 + rnd() * 0.08, sp: 0.2 + rnd() * 0.3 })),
    lean: 0,
  }),
  update(c, e, x, y, r) {
    let target = 0;
    if (e.seen) {
      const d = Math.hypot(e.mx - x, e.my - y);
      if (d < r * 3) target = Math.sign(x - e.mx) * (1 - d / (r * 3)) * 0.18;
    }
    c.lean += (target - c.lean) * Math.min(1, e.dt * 2.5);
  },
  draw(g, c, e, x, y, r, a) {
    const pink = e.accent;
    const cyan = e.accent2;
    const m = marble(e);
    const w = r * 0.5;
    const h = r * 2.2;
    const bob = Math.sin(e.t * 0.35 + c.ph) * r * 0.06;
    g.save();
    g.translate(x, y + bob);
    g.rotate(c.tilt + Math.sin(e.t * 0.18 + c.ph) * 0.05 + c.lean);
    // shaft
    const shaft = g.createLinearGradient(-w, 0, w, 0);
    shaft.addColorStop(0, rgba(mix(m, pink, 0.35), a));
    shaft.addColorStop(0.45, rgba(mix(m, [150, 130, 190], 0.5), a));
    shaft.addColorStop(1, rgba(mix([40, 30, 80], cyan, 0.25), a));
    g.fillStyle = shaft;
    g.beginPath();
    g.moveTo(-w * 0.86, h * 0.42);
    g.lineTo(-w * 0.78, -h * 0.4);
    // the broken top, uneven
    const top = c.jag.map((j, i) => [-w * 0.78 + (i / (c.jag.length - 1)) * w * 1.56, -h * 0.4 - j * r * 0.28] as const);
    top.forEach(([px, py]) => g.lineTo(px, py));
    g.lineTo(w * 0.78, -h * 0.4);
    g.lineTo(w * 0.86, h * 0.42);
    g.closePath();
    g.fill();
    // flutes
    g.strokeStyle = rgba([30, 20, 70], a * 0.28);
    g.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      const fx = (i / 3.5) * w * 0.74;
      g.beginPath();
      g.moveTo(fx * 1.04, h * 0.42);
      g.lineTo(fx, -h * 0.4);
      g.stroke();
    }
    // rim light from the right, in the cool colour
    g.strokeStyle = rgba(cyan, a * 0.6);
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(w * 0.86, h * 0.42);
    g.lineTo(w * 0.78, -h * 0.4);
    g.stroke();
    // base slabs
    for (let i = 0; i < 2; i++) {
      const bw = w * (1.25 + i * 0.35);
      const by = h * 0.42 + i * r * 0.14;
      const slab = g.createLinearGradient(-bw, 0, bw, 0);
      slab.addColorStop(0, rgba(mix(m, pink, 0.3), a));
      slab.addColorStop(1, rgba(mix([60, 44, 100], cyan, 0.2), a));
      g.fillStyle = slab;
      g.fillRect(-bw, by, bw * 2, r * 0.14);
      g.strokeStyle = rgba([255, 255, 255], a * 0.35);
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(-bw, by);
      g.lineTo(bw, by);
      g.stroke();
    }
    g.restore();
    // fragments that circle the break
    for (const f of c.frag) {
      const ang = f.a + e.t * f.sp;
      const fx = x + Math.cos(ang) * r * f.d;
      const fy = y - h * 0.5 + Math.sin(ang) * r * f.d * 0.4 + bob;
      g.save();
      g.translate(fx, fy);
      g.rotate(ang * 2);
      g.fillStyle = rgba(mix(m, [120, 100, 170], 0.45), a * 0.95);
      g.beginPath();
      g.moveTo(-r * f.s, -r * f.s * 0.6);
      g.lineTo(r * f.s * 1.1, -r * f.s * 0.3);
      g.lineTo(r * f.s * 0.5, r * f.s * 0.9);
      g.lineTo(-r * f.s * 0.8, r * f.s * 0.5);
      g.closePath();
      g.fill();
      g.restore();
    }
  },
};

// ---------------------------------------------------------------------------------------------
// Sun disk: a flat gradient circle cut by horizontal slits that widen toward the bottom and creep
// slowly downward, with one thin ring around it.
// ---------------------------------------------------------------------------------------------

interface Sun {
  ph: number;
  speed: number;
}

const sun: Kind<Sun> = {
  id: "sun",
  weight: 1.4,
  radius: [50, 110],
  depth: [0.4, 0.7],
  reach: 1.5,
  make: (rnd) => ({ ph: rnd() * 40, speed: 5 + rnd() * 6 }),
  draw(g, s, e, x, y, r, a) {
    const pink = e.accent;
    const cyan = e.accent2;
    g.save();
    g.translate(x, y);
    g.beginPath();
    g.arc(0, 0, r, 0, TAU);
    g.clip();
    const grad = g.createLinearGradient(0, -r, 0, r);
    grad.addColorStop(0, rgba(mix([255, 246, 170], pink, 0.15), a * 0.9));
    grad.addColorStop(0.5, rgba(pink, a * 0.9));
    grad.addColorStop(1, rgba(mix(pink, [120, 70, 220], 0.7), a * 0.9));
    g.fillStyle = grad;
    g.fillRect(-r, -r, r * 2, r * 2);
    g.globalCompositeOperation = "destination-out";
    const step = r * 0.2;
    const drift = ((e.t * s.speed + s.ph) % step);
    for (let yy = -r * 0.1 + drift; yy < r; yy += step) {
      const th = 1 + Math.max(0, (yy + r * 0.1) / r) * r * 0.09;
      g.fillRect(-r, yy, r * 2, th);
    }
    g.restore();
    g.strokeStyle = rgba(cyan, a * 0.45);
    g.lineWidth = 1;
    g.beginPath();
    g.arc(x, y, r * 1.14, 0, TAU);
    g.stroke();
  },
};

// ---------------------------------------------------------------------------------------------
// Arch: a portal in two coloured lines, a faint window of colour inside it, and one small sphere
// that travels slowly through it and back.
// ---------------------------------------------------------------------------------------------

interface Arch {
  ph: number;
  sway: number;
}

const arch: Kind<Arch> = {
  id: "arch",
  weight: 2,
  radius: [70, 130],
  depth: [0.55, 0.85],
  reach: 1.5,
  make: (rnd) => ({ ph: rnd() * TAU, sway: (rnd() - 0.5) * 0.2 }),
  draw(g, s, e, x, y, r, a) {
    const pink = e.accent;
    const cyan = e.accent2;
    const w = r * 0.75;
    const h = r * 1.15;
    g.save();
    g.translate(x, y + Math.sin(e.t * 0.3 + s.ph) * r * 0.04);
    g.rotate(s.sway + Math.sin(e.t * 0.15 + s.ph) * 0.03);
    const path = (inset: number) => {
      g.beginPath();
      g.moveTo(-w + inset, h);
      g.lineTo(-w + inset, -h * 0.1);
      g.arc(0, -h * 0.1, w - inset, Math.PI, 0);
      g.lineTo(w - inset, h);
    };
    path(0);
    const window = g.createLinearGradient(0, -h, 0, h);
    window.addColorStop(0, rgba(pink, a * 0.05));
    window.addColorStop(1, rgba(cyan, a * 0.2));
    g.fillStyle = window;
    g.fill();
    const line = g.createLinearGradient(-w, -h, w, h);
    line.addColorStop(0, rgba(cyan, a * 0.9));
    line.addColorStop(1, rgba(pink, a * 0.9));
    g.strokeStyle = line;
    g.lineWidth = 3;
    g.stroke();
    path(r * 0.12);
    g.lineWidth = 1;
    g.strokeStyle = rgba(mix(pink, [255, 255, 255], 0.3), a * 0.55);
    g.stroke();
    // the base line
    g.strokeStyle = rgba(cyan, a * 0.7);
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-w * 1.25, h);
    g.lineTo(w * 1.25, h);
    g.stroke();
    // the sphere travelling through, slowly, and back
    const k = (Math.sin(e.t * 0.22 + s.ph) + 1) / 2;
    const sy = h * 0.8 - k * h * 1.5;
    const sr = r * 0.12 * (0.8 + k * 0.4);
    const ball = g.createRadialGradient(-sr * 0.3, sy - sr * 0.3, sr * 0.1, 0, sy, sr);
    ball.addColorStop(0, rgba([255, 255, 255], a));
    ball.addColorStop(0.4, rgba(pink, a));
    ball.addColorStop(1, rgba(mix(cyan, [20, 10, 60], 0.5), a));
    g.fillStyle = ball;
    g.beginPath();
    g.arc(0, sy, sr, 0, TAU);
    g.fill();
    g.restore();
  },
};

// ---------------------------------------------------------------------------------------------
// Sphere on a plinth: a glossy sphere hovering above a stepped stone, its reflection split between
// the warm sky and the cool floor, with a shadow that tightens as it rises.
// ---------------------------------------------------------------------------------------------

interface Plinth {
  ph: number;
}

const plinth: Kind<Plinth> = {
  id: "plinth",
  weight: 2,
  radius: [50, 100],
  depth: [0.7, 1],
  zone: "side",
  reach: 1.6,
  make: (rnd) => ({ ph: rnd() * TAU }),
  draw(g, s, e, x, y, r, a) {
    const pink = e.accent;
    const cyan = e.accent2;
    const m = marble(e);
    const base = y + r * 1.0;
    // steps
    for (let i = 0; i < 3; i++) {
      const w = r * (0.9 - i * 0.2);
      const top = base - (i + 1) * r * 0.2;
      const face = g.createLinearGradient(x - w, 0, x + w, 0);
      face.addColorStop(0, rgba(mix(m, pink, 0.3), a));
      face.addColorStop(1, rgba(mix([48, 38, 96], cyan, 0.25), a));
      g.fillStyle = face;
      g.fillRect(x - w, top, w * 2, r * 0.2);
      g.fillStyle = rgba([255, 255, 255], a * 0.3);
      g.fillRect(x - w, top, w * 2, 1.2);
    }
    const rise = (Math.sin(e.t * 0.5 + s.ph) + 1) / 2;
    const sr = r * 0.55;
    const sy = base - r * 0.6 - sr - rise * r * 0.5;
    // shadow on the top step
    g.fillStyle = rgba([20, 10, 50], a * (0.35 - rise * 0.15));
    g.beginPath();
    g.ellipse(x, base - r * 0.6, sr * (0.9 - rise * 0.25), sr * 0.14, 0, 0, TAU);
    g.fill();
    // the sphere: warm sky above, a bright horizon, cool floor below
    g.save();
    g.beginPath();
    g.arc(x, sy, sr, 0, TAU);
    g.clip();
    const env = g.createLinearGradient(0, sy - sr, 0, sy + sr);
    env.addColorStop(0, rgba([255, 236, 170], a));
    env.addColorStop(0.42, rgba(pink, a));
    env.addColorStop(0.5, rgba([255, 255, 255], a));
    env.addColorStop(0.56, rgba(mix(cyan, [10, 10, 60], 0.6), a));
    env.addColorStop(1, rgba(cyan, a));
    g.fillStyle = env;
    g.fillRect(x - sr, sy - sr, sr * 2, sr * 2);
    const shade = g.createRadialGradient(x - sr * 0.35, sy - sr * 0.4, sr * 0.1, x, sy, sr * 1.1);
    shade.addColorStop(0, "rgba(255,255,255,0.0)");
    shade.addColorStop(0.7, "rgba(20,10,60,0.18)");
    shade.addColorStop(1, "rgba(10,0,40,0.6)");
    g.fillStyle = shade;
    g.fillRect(x - sr, sy - sr, sr * 2, sr * 2);
    g.restore();
    g.fillStyle = rgba([255, 255, 255], a * 0.9);
    g.beginPath();
    g.ellipse(x - sr * 0.38, sy - sr * 0.45, sr * 0.14, sr * 0.08, -0.6, 0, TAU);
    g.fill();
  },
};

// ---------------------------------------------------------------------------------------------
// Solids: a cube or an octahedron turning slowly, faces lit from the upper left and tinted warm and
// cool, with a bright edge. They turn faster as the cursor comes near.
// ---------------------------------------------------------------------------------------------

interface Wire {
  solid: Solid;
  rx: number;
  ry: number;
  rz: number;
  sx: number;
  sy: number;
  boost: number;
}

const solid: Kind<Wire> = {
  id: "solid",
  weight: 2.2,
  radius: [34, 72],
  depth: [0.6, 1],
  reach: 1.5,
  make: (rnd) => ({ solid: rnd() < 0.55 ? CUBE : OCTAHEDRON, rx: rnd() * TAU, ry: rnd() * TAU, rz: rnd() * TAU, sx: 0.12 + rnd() * 0.2, sy: 0.15 + rnd() * 0.25, boost: 0 }),
  update(s, e, x, y, r) {
    let target = 0;
    if (e.seen) {
      const d = Math.hypot(e.mx - x, e.my - y);
      if (d < r * 4) target = (1 - d / (r * 4)) * 2.5;
    }
    s.boost += (target - s.boost) * Math.min(1, e.dt * 3);
    s.rx += (s.sx + s.boost) * e.dt;
    s.ry += (s.sy + s.boost * 0.8) * e.dt;
  },
  draw(g, s, e, x, y, r, a) {
    const pink = e.accent;
    const cyan = e.accent2;
    const faces = visibleFaces(s.solid, s.rx, s.ry, s.rz);
    const bob = Math.sin(e.t * 0.4 + s.rz) * r * 0.1;
    for (const f of faces) {
      const lit = Math.max(0, -(f.n[0] * 0.5 + f.n[1] * 0.7 + f.n[2] * 0.5));
      const tone = mix(cyan, pink, (f.n[0] + 1) / 2);
      g.fillStyle = rgba(mix([22, 14, 60], tone, 0.18 + lit * 0.62), a * 0.7);
      g.strokeStyle = rgba(mix(tone, [255, 255, 255], 0.5), a * 0.85);
      g.lineWidth = 1.2;
      g.lineJoin = "round";
      g.beginPath();
      f.pts.forEach((p, i) => {
        const [px, py] = project(p, x, y + bob, r * 0.62);
        if (i) g.lineTo(px, py);
        else g.moveTo(px, py);
      });
      g.closePath();
      g.fill();
      g.stroke();
    }
  },
};

export const kinds: Kind[] = [column, sun, arch, plinth, ...more] as Kind[];
void solid;

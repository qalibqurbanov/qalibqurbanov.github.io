import { OCTAHEDRON, PRISM, project, visibleFaces, type Solid } from "../shared/scene/geometry";
import type { Rgb } from "../shared/scene/types";
import { mix, rgba } from "../shared/scene/util";
import type { Kind } from "../shared/scene/world";

const TAU = Math.PI * 2;

/** One neon tube: a wide soft halo, a bright body, and a near-white core, all on `lighter`. */
function tube(g: CanvasRenderingContext2D, path: () => void, color: Rgb, a: number, width = 3) {
  g.save();
  g.globalCompositeOperation = "lighter";
  g.lineCap = "round";
  g.lineJoin = "round";
  path();
  g.strokeStyle = rgba(color, a * 0.12);
  g.lineWidth = width * 7;
  g.stroke();
  path();
  g.strokeStyle = rgba(color, a * 0.3);
  g.lineWidth = width * 3;
  g.stroke();
  path();
  g.strokeStyle = rgba(mix(color, [255, 245, 255], 0.55), a * 0.95);
  g.lineWidth = width * 0.8;
  g.stroke();
  g.restore();
}

// ---------------------------------------------------------------------------------------------
// Neon sign: a mounted sign built from tube segments. The light is steady with a very slow
// breathing; now and then, a long way apart, one failing tube dips twice and recovers, the way a real
// sign does. It never flashes at random.
// ---------------------------------------------------------------------------------------------

interface Sign {
  style: number;
  tone: number;
  ph: number;
  fault: number;
  nextFault: number;
  rot: number;
}

const sign: Kind<Sign> = {
  id: "sign",
  weight: 3,
  radius: [40, 92],
  depth: [0.8, 1],
  zone: "side",
  reach: 1.8,
  make: (rnd) => ({ style: Math.floor(rnd() * 4), tone: rnd(), ph: rnd() * TAU, fault: -10, nextFault: 8 + rnd() * 30, rot: (rnd() - 0.5) * 0.12 }),
  update(s, e) {
    if (e.t > s.nextFault) {
      s.fault = e.t;
      s.nextFault = e.t + 22 + Math.random() * 40;
    }
  },
  draw(g, s, e, x, y, r, a) {
    const hot: Rgb = e.accent;
    const cool: Rgb = e.accent2;
    const breathe = 0.9 + 0.1 * Math.sin(e.t * 0.8 + s.ph);
    // the failing tube: two dips in the first third of a second
    const age = e.t - s.fault;
    const dip = age >= 0 && age < 0.4 ? (age < 0.12 || (age > 0.2 && age < 0.3) ? 0.25 : 1) : 1;
    const main = (s.tone < 0.5 ? hot : cool) as Rgb;
    const alt = (s.tone < 0.5 ? cool : hot) as Rgb;
    g.save();
    g.translate(x, y);
    g.rotate(s.rot);
    // the mount: a dark post and two brackets
    g.strokeStyle = rgba([10, 4, 24], a * 0.9);
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, -r * 1.55);
    g.lineTo(0, -r * 1.05);
    g.moveTo(-r * 0.5, -r * 1.05);
    g.lineTo(r * 0.5, -r * 1.05);
    g.stroke();
    // a dark plate that the tubes are fixed to, so the sign reads as an object and not as lines
    g.fillStyle = rgba([8, 2, 20], a * 0.55);
    g.fillRect(-r * 0.62, -r * 1.02, r * 1.24, r * 1.7);
    const k = breathe * a;
    switch (s.style) {
      case 0: {
        // a triangle with a bar through it
        tube(g, () => {
          g.beginPath();
          g.moveTo(0, -r * 0.8);
          g.lineTo(r * 0.5, r * 0.45);
          g.lineTo(-r * 0.5, r * 0.45);
          g.closePath();
        }, main, k);
        tube(g, () => {
          g.beginPath();
          g.moveTo(-r * 0.7, r * 0.02);
          g.lineTo(r * 0.7, r * 0.02);
        }, alt, k * dip);
        break;
      }
      case 1: {
        // three nested chevrons
        for (let i = 0; i < 3; i++) {
          tube(g, () => {
            g.beginPath();
            g.moveTo(-r * (0.5 - i * 0.12), -r * 0.55 + i * r * 0.3);
            g.lineTo(0, -r * 0.18 + i * r * 0.3);
            g.lineTo(r * (0.5 - i * 0.12), -r * 0.55 + i * r * 0.3);
          }, i === 1 ? alt : main, k * (i === 1 ? dip : 1), 2.6);
        }
        break;
      }
      case 2: {
        // a ring with a slash and a smaller ring
        tube(g, () => {
          g.beginPath();
          g.arc(0, -r * 0.2, r * 0.46, 0, TAU);
        }, main, k);
        tube(g, () => {
          g.beginPath();
          g.moveTo(-r * 0.6, r * 0.45);
          g.lineTo(r * 0.6, -r * 0.85);
        }, alt, k * dip);
        tube(g, () => {
          g.beginPath();
          g.arc(0, -r * 0.2, r * 0.2, 0, TAU);
        }, main, k, 2.4);
        break;
      }
      default: {
        // a stack of horizontal bars of falling length, like a level meter
        for (let i = 0; i < 5; i++) {
          tube(g, () => {
            g.beginPath();
            g.moveTo(-r * (0.55 - i * 0.07), -r * 0.7 + i * r * 0.28);
            g.lineTo(r * (0.55 - i * 0.07), -r * 0.7 + i * r * 0.28);
          }, i % 2 ? alt : main, k * (i === 2 ? dip : 1), 2.4);
        }
      }
    }
    g.restore();
  },
};

// ---------------------------------------------------------------------------------------------
// Tower: a far skyscraper in silhouette with a neon edge, a grid of lit windows that change very
// rarely, and a beacon on the roof that pulses on a slow, even beat.
// ---------------------------------------------------------------------------------------------

interface Tower {
  cols: number;
  rows: number;
  lit: number[];
  tiers: { w: number; h: number }[];
  ph: number;
  tone: number;
  next: number;
}

const tower: Kind<Tower> = {
  id: "tower",
  weight: 2.4,
  radius: [70, 150],
  depth: [0.5, 0.85],
  zone: "edge",
  reach: 1.7,
  make(rnd) {
    const cols = 5 + Math.floor(rnd() * 3);
    const rows = 16 + Math.floor(rnd() * 10);
    return {
      cols,
      rows,
      lit: Array.from({ length: cols * rows }, () => (rnd() < 0.34 ? 1 + Math.floor(rnd() * 2) : 0)),
      tiers: [{ w: 1, h: 0.62 }, { w: 0.78, h: 0.26 }, { w: 0.5, h: 0.12 }],
      ph: rnd() * TAU,
      tone: rnd(),
      next: 12 + rnd() * 30,
    };
  },
  update(s, e) {
    // one window changes now and then
    if (e.t > s.next) {
      s.next = e.t + 14 + Math.random() * 40;
      const i = Math.floor(Math.random() * s.lit.length);
      s.lit[i] = s.lit[i] ? 0 : 1 + Math.floor(Math.random() * 2);
    }
  },
  draw(g, s, e, x, y, r, a) {
    const hot: Rgb = e.accent;
    const cool: Rgb = e.accent2;
    const edge = s.tone < 0.5 ? hot : cool;
    const width = r * 0.62;
    const total = r * 2.5;
    let bottom = y + r * 1.2;
    let rowOffset = 0;
    for (let ti = 0; ti < s.tiers.length; ti++) {
      const t = s.tiers[ti];
      const w = width * t.w;
      const h = total * t.h;
      const top = bottom - h;
      const body = g.createLinearGradient(x - w, 0, x + w, 0);
      body.addColorStop(0, rgba(e.light ? [70, 40, 110] : [14, 6, 34], a * 0.96));
      body.addColorStop(1, rgba(e.light ? [90, 50, 130] : [24, 10, 52], a * 0.96));
      g.fillStyle = body;
      g.fillRect(x - w, top, w * 2, h);
      // windows
      const cellW = (w * 2) / s.cols;
      const rows = Math.round(s.rows * t.h * 1.6);
      const cellH = h / rows;
      for (let ry = 0; ry < rows; ry++) {
        for (let cx = 0; cx < s.cols; cx++) {
          const v = s.lit[(ry + rowOffset + cx * 7) % s.lit.length];
          if (!v) continue;
          g.fillStyle = rgba(v === 1 ? mix(hot, [255, 220, 200], 0.4) : mix(cool, [220, 255, 255], 0.4), a * 0.7);
          g.fillRect(x - w + cx * cellW + cellW * 0.22, top + ry * cellH + cellH * 0.25, cellW * 0.56, cellH * 0.5);
        }
      }
      rowOffset += rows;
      // the neon edge, down the lit side, and across the top of the tier
      tube(g, () => {
        g.beginPath();
        g.moveTo(x + w, bottom);
        g.lineTo(x + w, top);
        g.lineTo(x - w, top);
      }, edge, a * 0.8, 1.6);
      bottom = top;
    }
    // roof mast and a beacon on a slow even pulse
    g.strokeStyle = rgba([40, 30, 70], a);
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x, bottom);
    g.lineTo(x, bottom - r * 0.5);
    g.stroke();
    const beat = 0.5 + 0.5 * Math.sin(e.t * 1.4 + s.ph);
    g.save();
    g.globalCompositeOperation = "lighter";
    const halo = g.createRadialGradient(x, bottom - r * 0.5, 0, x, bottom - r * 0.5, r * 0.22);
    halo.addColorStop(0, rgba(hot, a * (0.3 + beat * 0.6)));
    halo.addColorStop(1, rgba(hot, 0));
    g.fillStyle = halo;
    g.fillRect(x - r * 0.25, bottom - r * 0.75, r * 0.5, r * 0.5);
    g.restore();
  },
};

// ---------------------------------------------------------------------------------------------
// Grid panel: a floating pane of glowing grid turning slowly about its vertical axis, drawn in
// perspective so its far edge shrinks and the lines converge.
// ---------------------------------------------------------------------------------------------

interface Panel {
  ang: number;
  spin: number;
  tone: number;
  tilt: number;
}

const panel: Kind<Panel> = {
  id: "panel",
  weight: 2,
  radius: [70, 140],
  depth: [0.55, 0.9],
  reach: 1.4,
  make: (rnd) => ({ ang: rnd() * TAU, spin: (0.08 + rnd() * 0.12) * (rnd() < 0.5 ? -1 : 1), tone: rnd(), tilt: (rnd() - 0.5) * 0.3 }),
  update(p, e) {
    p.ang += p.spin * e.dt;
  },
  draw(g, p, e, x, y, r, a) {
    const color: Rgb = p.tone < 0.5 ? e.accent2 : e.accent;
    const half = r;
    const pts = (u: number, v: number): [number, number] => {
      const px = u * Math.cos(p.ang);
      const pz = u * Math.sin(p.ang);
      const f = 1 / (1 + 0.35 * (pz / half));
      return [x + px * f, y + v * 0.7 * f + px * p.tilt * 0.4];
    };
    const n = 6;
    // the faint pane
    g.beginPath();
    [[-half, -half], [half, -half], [half, half], [-half, half]].forEach(([u, v], i) => {
      const [px, py] = pts(u, v);
      if (i) g.lineTo(px, py);
      else g.moveTo(px, py);
    });
    g.closePath();
    g.fillStyle = rgba(color, a * 0.06);
    g.fill();
    tube(g, () => {
      g.beginPath();
      [[-half, -half], [half, -half], [half, half], [-half, half]].forEach(([u, v], i) => {
        const [px, py] = pts(u, v);
        if (i) g.lineTo(px, py);
        else g.moveTo(px, py);
      });
      g.closePath();
    }, color, a * 0.7, 1.4);
    g.save();
    g.globalCompositeOperation = "lighter";
    g.strokeStyle = rgba(color, a * 0.32);
    g.lineWidth = 0.9;
    for (let i = 1; i < n; i++) {
      const k = -half + (i / n) * half * 2;
      let [x1, y1] = pts(k, -half);
      let [x2, y2] = pts(k, half);
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      [x1, y1] = pts(-half, k);
      [x2, y2] = pts(half, k);
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    }
    g.restore();
  },
};

// ---------------------------------------------------------------------------------------------
// Crystal: an octahedron or a prism with shaded faces and a neon edge, turning slowly, brighter on
// the side facing the light.
// ---------------------------------------------------------------------------------------------

interface Crystal {
  solid: Solid;
  rx: number;
  ry: number;
  sx: number;
  sy: number;
  tone: number;
}

const crystal: Kind<Crystal> = {
  id: "crystal",
  weight: 1.6,
  radius: [34, 70],
  depth: [0.7, 1],
  reach: 1.5,
  make: (rnd) => ({ solid: rnd() < 0.6 ? OCTAHEDRON : PRISM, rx: rnd() * TAU, ry: rnd() * TAU, sx: 0.1 + rnd() * 0.15, sy: 0.15 + rnd() * 0.2, tone: rnd() }),
  update(c, e) {
    c.rx += c.sx * e.dt;
    c.ry += c.sy * e.dt;
  },
  draw(g, c, e, x, y, r, a) {
    const hot: Rgb = e.accent;
    const cool: Rgb = e.accent2;
    const bob = Math.sin(e.t * 0.5 + c.rx) * r * 0.08;
    for (const f of visibleFaces(c.solid, c.rx, c.ry)) {
      const lit = Math.max(0, -(f.n[0] * 0.4 + f.n[1] * 0.8 + f.n[2] * 0.4));
      g.fillStyle = rgba(mix([14, 4, 36], c.tone < 0.5 ? hot : cool, 0.12 + lit * 0.5), a * 0.82);
      g.beginPath();
      f.pts.forEach((p, i) => {
        const [px, py] = project(p, x, y + bob, r * 0.7);
        if (i) g.lineTo(px, py);
        else g.moveTo(px, py);
      });
      g.closePath();
      g.fill();
      tube(g, () => {
        g.beginPath();
        f.pts.forEach((p, i) => {
          const [px, py] = project(p, x, y + bob, r * 0.7);
          if (i) g.lineTo(px, py);
          else g.moveTo(px, py);
        });
        g.closePath();
      }, lit > 0.45 ? cool : hot, a * 0.7, 1.2);
    }
  },
};

// ---------------------------------------------------------------------------------------------
// Light trails: a pair of tail lights drawing a long streak across the page on a fixed track, one pass
// every so often, with a trail that fades behind it.
// ---------------------------------------------------------------------------------------------

interface Trail {
  speed: number;
  period: number;
  phase: number;
  dir: number;
  tone: number;
  gap: number;
}

const trail: Kind<Trail> = {
  id: "trail",
  weight: 2,
  radius: [80, 140],
  depth: [0.9, 1],
  reach: 6,
  make: (rnd) => ({ speed: 520 + rnd() * 420, period: 9 + rnd() * 9, phase: rnd() * 20, dir: rnd() < 0.5 ? 1 : -1, tone: rnd(), gap: 5 + rnd() * 6 }),
  draw(g, s, e, x, y, r, a) {
    const t = (e.t + s.phase) % s.period;
    const run = (e.w + r * 4) / s.speed;
    if (t > run) return;
    const head = (t / run) * (e.w + r * 4) - r * 2;
    const px = s.dir > 0 ? head : e.w - head;
    const len = r * 2.4;
    const color: Rgb = s.tone < 0.6 ? e.accent : e.accent2;
    g.save();
    g.globalCompositeOperation = "lighter";
    for (const off of [-s.gap, s.gap]) {
      const grad = g.createLinearGradient(px, 0, px - s.dir * len, 0);
      grad.addColorStop(0, rgba([255, 240, 250], a * 0.95));
      grad.addColorStop(0.08, rgba(color, a * 0.8));
      grad.addColorStop(1, rgba(color, 0));
      g.strokeStyle = grad;
      g.lineWidth = 2.2;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(px, y + off);
      g.lineTo(px - s.dir * len, y + off);
      g.stroke();
    }
    const glow = g.createRadialGradient(px, y, 0, px, y, 26);
    glow.addColorStop(0, rgba(color, a * 0.5));
    glow.addColorStop(1, rgba(color, 0));
    g.fillStyle = glow;
    g.fillRect(px - 26, y - 26, 52, 52);
    g.restore();
  },
};

// Primitive towers, panels and crystals are gone: the skyline, the road and the car are built properly
// (skyline.ts, road.ts, car.ts).
export const kinds: Kind[] = [sign, trail] as Kind[];
void tower;
void panel;
void crystal;

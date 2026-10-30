import type { Rgb } from "../shared/scene/types";
import { makeLayer, mix, rgba } from "../shared/scene/util";
import type { Kind } from "../shared/scene/world";

const TAU = Math.PI * 2;
const ink = (e: { text: Rgb }): Rgb => e.text;

let concrete: CanvasPattern | null = null;
function concretePattern(g: CanvasRenderingContext2D): CanvasPattern | null {
  if (concrete) return concrete;
  const [c, ctx] = makeLayer(160, 160);
  for (let i = 0; i < 900; i++) {
    const v = Math.floor(Math.random() * 255);
    ctx.fillStyle = `rgba(${v},${v},${v},${0.05 + Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * 160, Math.random() * 160, 1 + Math.random() * 2, 1 + Math.random());
  }
  concrete = g.createPattern(c, "repeat");
  return concrete;
}

// ---------------------------------------------------------------------------------------------
// Brutalist block: a stepped mass of raw concrete, with deep window slits and a hard shadow. The light
// moves across the sky as you read, so the shadow swings from one side of the building to the other.
// ---------------------------------------------------------------------------------------------

interface Block {
  tiers: { w: number; h: number; off: number; slits: number }[];
}

const brutalist: Kind<Block> = {
  id: "brutalist",
  weight: 2.4,
  radius: [80, 150],
  depth: [0.85, 1],
  zone: "edge",
  reach: 2,
  make(rnd, r) {
    return { tiers: Array.from({ length: 3 + Math.floor(rnd() * 2) }, (_, i) => ({ w: r * (0.8 - i * 0.14 + rnd() * 0.1), h: r * (0.3 + rnd() * 0.22), off: (rnd() - 0.4) * r * 0.2, slits: 3 + Math.floor(rnd() * 5) })) };
  },
  draw(g, b, e, x, y, r, a) {
    const progress = Math.min(1, e.scrollY / e.scrollMax);
    const sun = -0.9 + progress * 1.8;
    const dir = Math.sign(sun) || 1;
    const shadowLen = r * (0.4 + Math.abs(Math.sin(sun)) * 1.1);
    const total = b.tiers.reduce((acc, t) => acc + t.h, 0);
    let bottom = y + total / 2;
    const pat = concretePattern(g);
    const lit = mix(e.bg, ink(e), 0.78);
    const side = mix(e.bg, ink(e), 0.36);
    // the shadow of the whole mass on the ground
    g.fillStyle = rgba(ink(e), a * 0.14);
    g.beginPath();
    g.moveTo(x - b.tiers[0].w / 2 + b.tiers[0].off, y + total / 2);
    g.lineTo(x + b.tiers[0].w / 2 + b.tiers[0].off, y + total / 2);
    g.lineTo(x + b.tiers[0].w / 2 + b.tiers[0].off + dir * shadowLen, y + total / 2 + r * 0.06);
    g.lineTo(x - b.tiers[0].w / 2 + b.tiers[0].off + dir * shadowLen, y + total / 2 + r * 0.06);
    g.closePath();
    g.fill();
    for (const t of b.tiers) {
      const left = x - t.w / 2 + t.off;
      const top = bottom - t.h;
      g.fillStyle = rgba(lit, a * 0.96);
      g.fillRect(left, top, t.w, t.h);
      // the side in shade
      g.fillStyle = rgba(side, a * 0.96);
      g.beginPath();
      g.moveTo(left + t.w, top);
      g.lineTo(left + t.w + r * 0.12, top + r * 0.05);
      g.lineTo(left + t.w + r * 0.12, bottom + r * 0.05);
      g.lineTo(left + t.w, bottom);
      g.closePath();
      g.fill();
      if (pat) {
        g.save();
        g.globalAlpha = a * 0.9;
        g.fillStyle = pat;
        g.fillRect(left, top, t.w, t.h);
        g.restore();
      }
      // deep slits
      const sw = t.w / (t.slits * 2 + 1);
      g.fillStyle = rgba(ink(e), a * 0.82);
      for (let i = 0; i < t.slits; i++) g.fillRect(left + sw * (1 + i * 2), top + t.h * 0.3, sw, t.h * 0.4);
      // the shadow cast by the tier above
      g.fillStyle = rgba(ink(e), a * 0.18);
      g.fillRect(left, top, t.w, t.h * 0.08);
      bottom = top;
    }
  },
};

// ---------------------------------------------------------------------------------------------
// Halftone sphere: a ball made of a regular grid of printed dots, whose size follows the light on it,
// the way a newspaper photograph is made. The light circles it slowly, so the highlight travels
// round the dots.
// ---------------------------------------------------------------------------------------------

interface Halftone {
  ph: number;
  rate: number;
}

const halftone: Kind<Halftone> = {
  id: "halftone",
  weight: 2.2,
  radius: [50, 110],
  depth: [0.7, 1],
  reach: 1.2,
  make: (rnd) => ({ ph: rnd() * TAU, rate: 0.06 + rnd() * 0.08 }),
  draw(g, h, e, x, y, r, a) {
    const step = Math.max(5, r / 9);
    const ang = e.t * h.rate + h.ph;
    const lx = Math.cos(ang) * 0.6;
    const ly = Math.sin(ang * 0.7) * 0.5 - 0.3;
    g.fillStyle = rgba(ink(e), a * 0.92);
    for (let gy = -r; gy <= r; gy += step) {
      for (let gx = -r; gx <= r; gx += step) {
        // staggered rows, as in a screen at 45 degrees
        const px = gx + (Math.round(gy / step) % 2 ? step / 2 : 0);
        const d = Math.hypot(px, gy) / r;
        if (d > 1) continue;
        const nz = Math.sqrt(1 - d * d);
        const light = Math.max(0, (px / r) * lx + (gy / r) * ly + nz * 0.7);
        const dot = step * 0.52 * (1 - Math.min(1, light));
        if (dot < 0.4) continue;
        g.beginPath();
        g.arc(x + px, y + gy, dot, 0, TAU);
        g.fill();
      }
    }
  },
};

// ---------------------------------------------------------------------------------------------
// Crank: a spoked flywheel with a connecting rod driving a slider along a track, the oldest way of
// turning rotation into a straight push. It runs slowly and without stopping.
// ---------------------------------------------------------------------------------------------

interface Crank {
  rot: number;
  speed: number;
}

const crank: Kind<Crank> = {
  id: "crank",
  weight: 1.8,
  radius: [60, 120],
  depth: [0.8, 1],
  reach: 1.8,
  make: (rnd) => ({ rot: rnd() * TAU, speed: (0.25 + rnd() * 0.25) * (rnd() < 0.5 ? -1 : 1) }),
  update(c, e) {
    c.rot += c.speed * e.dt;
  },
  draw(g, c, e, x, y, r, a) {
    const col = rgba(ink(e), a * 0.85);
    g.strokeStyle = col;
    g.fillStyle = col;
    g.lineWidth = 1.2;
    // the wheel: a rim, spokes and a hub
    g.beginPath();
    g.arc(x, y, r * 0.5, 0, TAU);
    g.stroke();
    g.beginPath();
    g.arc(x, y, r * 0.44, 0, TAU);
    g.stroke();
    for (let i = 0; i < 6; i++) {
      const ang = c.rot + (i / 6) * TAU;
      g.beginPath();
      g.moveTo(x + Math.cos(ang) * r * 0.1, y + Math.sin(ang) * r * 0.1);
      g.lineTo(x + Math.cos(ang) * r * 0.44, y + Math.sin(ang) * r * 0.44);
      g.stroke();
    }
    g.beginPath();
    g.arc(x, y, r * 0.09, 0, TAU);
    g.fill();
    // the crank pin, the connecting rod and the slider on its track
    const pin = [x + Math.cos(c.rot) * r * 0.36, y + Math.sin(c.rot) * r * 0.36];
    const rodLen = r * 1.1;
    const sx = pin[0] + Math.sqrt(Math.max(0, rodLen * rodLen - (pin[1] - y) ** 2));
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(pin[0], pin[1]);
    g.lineTo(sx, y);
    g.stroke();
    g.beginPath();
    g.arc(pin[0], pin[1], 3, 0, TAU);
    g.fill();
    g.lineWidth = 1;
    g.strokeRect(sx - r * 0.1, y - r * 0.08, r * 0.2, r * 0.16);
    g.beginPath();
    g.moveTo(x + r * 0.5, y + r * 0.12);
    g.lineTo(x + r * 1.7, y + r * 0.12);
    g.moveTo(x + r * 0.5, y - r * 0.12);
    g.lineTo(x + r * 1.7, y - r * 0.12);
    g.stroke();
  },
};

export const more: Kind[] = [brutalist, halftone, crank] as Kind[];

import { CUBE, OCTAHEDRON, PRISM, project, visibleFaces, type Solid } from "../shared/scene/geometry";
import type { Rgb } from "../shared/scene/types";
import { mix, rgba } from "../shared/scene/util";
import type { Kind } from "../shared/scene/world";
import { more } from "./more";

const TAU = Math.PI * 2;

/** Ink and paper for the current colour mode: the text colour and the page colour. */
const ink = (e: { text: Rgb }): Rgb => e.text;

// ---------------------------------------------------------------------------------------------
// Solid: a plain polyhedron turning slowly, each face a flat grey set by its angle to a light that
// stays in one place, so you read its form from the changing contrast. It turns a little faster as the
// cursor comes near.
// ---------------------------------------------------------------------------------------------

interface Sculpture {
  solid: Solid;
  rx: number;
  ry: number;
  rz: number;
  sx: number;
  sy: number;
  boost: number;
}

const sculpture: Kind<Sculpture> = {
  id: "solid",
  weight: 3,
  radius: [50, 110],
  depth: [0.7, 1],
  reach: 1.5,
  make: (rnd) => ({ solid: [CUBE, OCTAHEDRON, PRISM][Math.floor(rnd() * 3)], rx: rnd() * TAU, ry: rnd() * TAU, rz: rnd() * TAU, sx: 0.06 + rnd() * 0.1, sy: 0.08 + rnd() * 0.12, boost: 0 }),
  update(s, e, x, y, r) {
    let target = 0;
    if (e.seen) {
      const d = Math.hypot(e.mx - x, e.my - y);
      if (d < r * 4) target = (1 - d / (r * 4)) * 1.4;
    }
    s.boost += (target - s.boost) * Math.min(1, e.dt * 2);
    s.rx += (s.sx + s.boost) * e.dt;
    s.ry += (s.sy + s.boost * 0.7) * e.dt;
  },
  draw(g, s, e, x, y, r, a) {
    const paper = e.bg;
    const faces = visibleFaces(s.solid, s.rx, s.ry, s.rz);
    for (const f of faces) {
      const lit = Math.max(0, -(f.n[0] * 0.45 + f.n[1] * 0.75 + f.n[2] * 0.5));
      g.fillStyle = rgba(mix(paper, ink(e), 0.1 + lit * 0.8), a * 0.92);
      g.strokeStyle = rgba(ink(e), a * 0.7);
      g.lineWidth = 1;
      g.lineJoin = "round";
      g.beginPath();
      f.pts.forEach((p, i) => {
        const [px, py] = project(p, x, y, r * 0.62, 0.1);
        if (i) g.lineTo(px, py);
        else g.moveTo(px, py);
      });
      g.closePath();
      g.fill();
      g.stroke();
    }
  },
};

// ---------------------------------------------------------------------------------------------
// Shards: a disc cut into vertical slices that slide against each other, apart and back together, in
// a slow wave. The slices move further when the cursor is close.
// ---------------------------------------------------------------------------------------------

interface Shards {
  n: number;
  ph: number;
  rate: number;
  excite: number;
  filled: number;
}

const shards: Kind<Shards> = {
  id: "shards",
  weight: 2.4,
  radius: [50, 110],
  depth: [0.7, 1],
  reach: 1.4,
  make: (rnd) => ({ n: 6 + Math.floor(rnd() * 5), ph: rnd() * TAU, rate: 0.22 + rnd() * 0.2, excite: 0, filled: Math.floor(rnd() * 3) }),
  update(s, e, x, y, r) {
    let target = 0;
    if (e.seen) {
      const d = Math.hypot(e.mx - x, e.my - y);
      if (d < r * 3) target = 1 - d / (r * 3);
    }
    s.excite += (target - s.excite) * Math.min(1, e.dt * 3);
  },
  draw(g, s, e, x, y, r, a) {
    const w = (r * 2) / s.n;
    for (let i = 0; i < s.n; i++) {
      const cx = -r + i * w + w / 2;
      const half = Math.sqrt(Math.max(0, r * r - cx * cx));
      const shift = Math.sin(e.t * s.rate * TAU + s.ph + i * 0.7) * r * (0.12 + s.excite * 0.35);
      const left = x - r + i * w;
      g.beginPath();
      g.rect(left + 0.5, y - half + shift, w - 1, half * 2);
      if (i % 3 === s.filled) {
        g.fillStyle = rgba(ink(e), a * 0.9);
        g.fill();
      } else {
        g.strokeStyle = rgba(ink(e), a * 0.7);
        g.lineWidth = 1;
        g.stroke();
      }
    }
  },
};

// ---------------------------------------------------------------------------------------------
// Typographic composition: a large glyph set as an outline in the display face, with a small caption
// below it in the label face. It drifts a little with the scroll and the outline thins and thickens
// very slowly.
// ---------------------------------------------------------------------------------------------

interface Type {
  glyph: string;
  caption: string;
  italic: boolean;
  ph: number;
  tilt: number;
}

const GLYPHS = ["Aa", "01", "§", "&", "№", "¶", "7", "Rg", "∞", "%"];

const typo: Kind<Type> = {
  id: "type",
  weight: 2.6,
  radius: [70, 150],
  depth: [0.5, 0.85],
  reach: 1.3,
  make: (rnd) => ({ glyph: GLYPHS[Math.floor(rnd() * GLYPHS.length)], caption: `FIG. ${String(1 + Math.floor(rnd() * 24)).padStart(2, "0")}`, italic: rnd() < 0.5, ph: rnd() * TAU, tilt: (rnd() - 0.5) * 0.12 }),
  draw(g, s, e, x, y, r, a) {
    g.save();
    g.translate(x, y);
    g.rotate(s.tilt);
    g.font = `${s.italic ? "italic " : ""}400 ${r * 1.9}px "Instrument Serif", Georgia, serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = 0.8 + 0.6 * Math.sin(e.t * 0.2 + s.ph) ** 2;
    g.strokeStyle = rgba(ink(e), a * 0.55);
    g.strokeText(s.glyph, 0, 0);
    g.font = `400 ${Math.max(9, r * 0.1)}px "IBM Plex Mono", monospace`;
    g.fillStyle = rgba(ink(e), a * 0.55);
    g.textAlign = "left";
    g.fillText(s.caption, -r * 0.7, r * 0.95);
    g.strokeStyle = rgba(ink(e), a * 0.3);
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-r * 0.7, r * 0.82);
    g.lineTo(r * 0.7, r * 0.82);
    g.stroke();
    g.restore();
  },
};

// ---------------------------------------------------------------------------------------------
// Arc composition: nested quarter and half circles in hairlines, each segment turning at its own slow
// rate, the way an architectural plan would be drawn.
// ---------------------------------------------------------------------------------------------

interface Arcs {
  rings: { radius: number; start: number; sweep: number; speed: number; width: number }[];
}

const arcs: Kind<Arcs> = {
  id: "arcs",
  weight: 2,
  radius: [60, 140],
  depth: [0.55, 0.9],
  reach: 1.2,
  make: (rnd) => ({ rings: Array.from({ length: 5 }, (_, i) => ({ radius: 0.28 + i * 0.18, start: rnd() * TAU, sweep: Math.PI * (0.5 + rnd() * 1.1), speed: (0.04 + rnd() * 0.1) * (rnd() < 0.5 ? -1 : 1), width: i % 2 ? 1 : 2 })) }),
  draw(g, s, e, x, y, r, a) {
    for (const ring of s.rings) {
      const start = ring.start + e.t * ring.speed + e.scrollY * 0.0004;
      g.strokeStyle = rgba(ink(e), a * 0.7);
      g.lineWidth = ring.width;
      g.beginPath();
      g.arc(x, y, r * ring.radius, start, start + ring.sweep);
      g.stroke();
    }
    g.fillStyle = rgba(ink(e), a);
    g.beginPath();
    g.arc(x, y, 2.4, 0, TAU);
    g.fill();
  },
};

// ---------------------------------------------------------------------------------------------
// Monolith: a tall slab in two tones with a long shadow across the ground. The shadow's angle follows
// how far down the page you are, as though the sun were crossing the sky while you read.
// ---------------------------------------------------------------------------------------------

interface Monolith {
  w: number;
  h: number;
  skew: number;
}

const monolith: Kind<Monolith> = {
  id: "monolith",
  weight: 1.6,
  radius: [70, 140],
  depth: [0.85, 1],
  zone: "edge",
  reach: 2.2,
  make: (rnd, r) => ({ w: r * (0.28 + rnd() * 0.14), h: r * (1.6 + rnd() * 0.7), skew: 0.18 + rnd() * 0.1 }),
  draw(g, s, e, x, y, r, a) {
    const progress = Math.min(1, e.scrollY / e.scrollMax);
    const baseY = y + s.h * 0.5;
    const sunAngle = -0.9 + progress * 1.8;
    const shadowLen = s.h * (0.5 + Math.abs(Math.sin(sunAngle)) * 1.4);
    const dir = Math.sign(sunAngle) || 1;
    // the shadow on the ground
    g.fillStyle = rgba(ink(e), a * 0.16);
    g.beginPath();
    g.moveTo(x - s.w * 0.5, baseY);
    g.lineTo(x + s.w * 0.5 + s.w * s.skew, baseY);
    g.lineTo(x + s.w * 0.5 + dir * shadowLen, baseY + s.h * 0.08);
    g.lineTo(x - s.w * 0.5 + dir * shadowLen, baseY + s.h * 0.08);
    g.closePath();
    g.fill();
    // the two faces: the lit one is lighter than the page, the other darker
    g.fillStyle = rgba(mix(e.bg, ink(e), 0.82), a * 0.95);
    g.fillRect(x - s.w * 0.5, baseY - s.h, s.w * 0.62, s.h);
    g.fillStyle = rgba(mix(e.bg, ink(e), 0.34), a * 0.95);
    g.beginPath();
    g.moveTo(x + s.w * 0.12, baseY - s.h);
    g.lineTo(x + s.w * 0.5 + s.w * s.skew, baseY - s.h + s.w * 0.1);
    g.lineTo(x + s.w * 0.5 + s.w * s.skew, baseY + s.w * 0.1);
    g.lineTo(x + s.w * 0.12, baseY);
    g.closePath();
    g.fill();
    void r;
  },
};

export const kinds: Kind[] = [sculpture, shards, typo, arcs, monolith, ...more] as Kind[];

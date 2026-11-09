import type { Rgb } from "../shared/scene/types";
import type { Kind } from "../shared/scene/world";

const TAU = Math.PI * 2;
const css = (c: Rgb, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const YELLOW: Rgb = [255, 225, 77];
const ORANGE: Rgb = [255, 138, 0];
const CONCRETE: Rgb = [218, 215, 204];
const WHITE: Rgb = [255, 255, 255];
const CREAM: Rgb = [255, 241, 179];
/** The outline and shadow colour of the current mode: pure black on yellow, a soft charcoal in light mode. */
let INK: Rgb = [0, 0, 0];
const ink = (a: number) => `rgba(${INK[0]},${INK[1]},${INK[2]},${a})`;

/** The pieces of one flat sticker: a hard black offset shadow, the colour, and a thick black outline. */
function solid(g: CanvasRenderingContext2D, path: Path2D, fill: Rgb, a: number, r: number) {
  const off = Math.max(3, r * 0.09);
  g.save();
  g.lineJoin = "miter";
  g.lineWidth = Math.max(2.5, r * 0.055);
  g.fillStyle = ink(a);
  g.translate(off, off);
  g.fill(path);
  g.restore();
  g.fillStyle = css(fill, a);
  g.strokeStyle = ink(a);
  g.fill(path);
  g.stroke(path);
}

/** Motion that jumps in steps, like a flipped card, instead of gliding. */
const ticks = (t: number, per: number) => Math.floor(t * per) / per;

interface Seed {
  ph: number;
  pick: number;
  tilt: number;
}
const seed = (rnd: () => number): Seed => ({ ph: rnd() * TAU, pick: rnd(), tilt: (rnd() - 0.5) * 0.5 });

function kind(id: string, over: Partial<Kind<Seed>>, draw: Kind<Seed>["draw"]): Kind {
  const wrapped: Kind<Seed>["draw"] = (g, s, e, x, y, r, a) => {
    INK = e.text;
    draw(g, s, e, x, y, r, a);
  };
  return { id, weight: 2, radius: [60, 110], depth: [0.7, 1], reach: 1.35, make: (rnd) => seed(rnd), draw: wrapped, ...over } as Kind;
}

function label(g: CanvasRenderingContext2D, text: string, size: number, fill = ink(1), weight = 900) {
  g.fillStyle = fill;
  g.font = `${weight} ${size}px Archivo, Inter, system-ui, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 0, size * 0.04);
}

const WORDS = ["NEW!", "WOW", "FREE", "HOT", "YES!", "NOW", "OK!", "100%"];

export const kinds: Kind[] = [
  // A spiky starburst with a shout in it. It turns in jumps.
  kind("burst", { weight: 3, radius: [64, 112], reach: 1.4 }, (g, s, e, x, y, r, a) => {
    const spikes = 14;
    const path = new Path2D();
    for (let i = 0; i < spikes * 2; i++) {
      const rr = i % 2 ? r * 0.72 : r;
      const ang = (i / (spikes * 2)) * TAU;
      path[i ? "lineTo" : "moveTo"](Math.cos(ang) * rr, Math.sin(ang) * rr);
    }
    path.closePath();
    g.save();
    g.translate(x, y);
    g.rotate(s.tilt + ticks(e.t, 3) * 0.12 * Math.sin(s.ph));
    solid(g, path, s.pick < 0.5 ? CONCRETE : ORANGE, a, r);
    g.globalAlpha = a;
    label(g, WORDS[Math.floor(s.pick * 997) % WORDS.length], r * 0.42);
    g.restore();
  }),

  // A fat arrow.
  kind("arrow", { weight: 2.2, radius: [70, 120], reach: 1.5 }, (g, s, e, x, y, r, a) => {
    const w = r * 1.6;
    const h = r * 0.62;
    const path = new Path2D();
    path.moveTo(-w / 2, -h * 0.28);
    path.lineTo(w * 0.1, -h * 0.28);
    path.lineTo(w * 0.1, -h * 0.62);
    path.lineTo(w / 2, 0);
    path.lineTo(w * 0.1, h * 0.62);
    path.lineTo(w * 0.1, h * 0.28);
    path.lineTo(-w / 2, h * 0.28);
    path.closePath();
    g.save();
    g.translate(x + Math.sin(ticks(e.t, 2) * 1.7 + s.ph) * 6, y);
    g.rotate(s.tilt * 2);
    solid(g, path, s.pick < 0.5 ? INK : (e.accent), a, r);
    g.restore();
  }),

  // A flat smiling face, which blinks.
  kind("smiley", { weight: 1.8, radius: [56, 96] }, (g, s, e, x, y, r, a) => {
    const path = new Path2D();
    path.arc(0, 0, r, 0, TAU);
    g.save();
    g.translate(x, y);
    g.rotate(s.tilt);
    solid(g, path, CONCRETE, a, r);
    g.fillStyle = ink(a);
    const blink = Math.sin(e.t * 0.9 + s.ph) > 0.96;
    g.fillRect(-r * 0.42, -r * 0.3, r * 0.2, blink ? r * 0.05 : r * 0.34);
    g.fillRect(r * 0.22, -r * 0.3, r * 0.2, blink ? r * 0.05 : r * 0.34);
    g.strokeStyle = ink(a);
    g.lineWidth = r * 0.1;
    g.lineCap = "butt";
    g.beginPath();
    g.arc(0, r * 0.05, r * 0.5, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
    g.restore();
  }),

  // A window: title bar, close box and a few blocks of text.
  kind("window", { weight: 2, radius: [70, 120], reach: 1.4 }, (g, s, e, x, y, r, a) => {
    const w = r * 1.7;
    const h = r * 1.2;
    const path = new Path2D();
    path.rect(-w / 2, -h / 2, w, h);
    g.save();
    g.translate(x, y);
    g.rotate(s.tilt * 0.6);
    solid(g, path, WHITE, a, r);
    g.fillStyle = css(s.pick < 0.5 ? ORANGE : (e.accent), a);
    g.fillRect(-w / 2, -h / 2, w, h * 0.2);
    g.strokeStyle = ink(a);
    g.lineWidth = Math.max(2.5, r * 0.055);
    g.strokeRect(-w / 2, -h / 2, w, h * 0.2);
    g.fillStyle = ink(a);
    g.fillRect(w / 2 - h * 0.17, -h / 2 + h * 0.04, h * 0.12, h * 0.12);
    const blocks = [0.78, 0.55, 0.68, 0.4];
    blocks.forEach((b, i) => g.fillRect(-w / 2 + w * 0.08, -h * 0.2 + i * h * 0.17, w * b * 0.84, h * 0.07));
    if (Math.floor(e.t * 1.6) % 2 === 0) g.fillRect(-w / 2 + w * 0.08 + w * 0.4 * 0.84, -h * 0.2 + 3 * h * 0.17 - 2, h * 0.05, h * 0.11);
    g.restore();
  }),

  // A strip of hazard tape, running across at an angle.
  kind("tape", { weight: 1.8, radius: [110, 170], reach: 1.2, depth: [0.8, 1], max: 2 }, (g, s, _e, x, y, r, a) => {
    const w = r * 2.4;
    const h = r * 0.3;
    g.save();
    g.translate(x, y);
    g.rotate(-0.35 + s.tilt * 0.6);
    g.beginPath();
    g.rect(-w / 2, -h / 2, w, h);
    g.clip();
    g.fillStyle = css(YELLOW, a);
    g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = ink(a);
    const sw = h * 0.9;
    for (let i = -w / sw - 2; i < w / sw + 2; i++) {
      g.beginPath();
      g.moveTo(i * sw * 2, -h / 2);
      g.lineTo(i * sw * 2 + sw, -h / 2);
      g.lineTo(i * sw * 2 + sw - h, h / 2);
      g.lineTo(i * sw * 2 - h, h / 2);
      g.fill();
    }
    g.restore();
    g.save();
    g.translate(x, y);
    g.rotate(-0.35 + s.tilt * 0.6);
    g.strokeStyle = ink(a);
    g.lineWidth = Math.max(2.5, r * 0.04);
    g.strokeRect(-w / 2, -h / 2, w, h);
    g.restore();
  }),

  // A barcode label, with its number.
  kind("barcode", { weight: 1.5, radius: [60, 100], max: 2 }, (g, s, _e, x, y, r, a) => {
    const w = r * 1.6;
    const h = r * 1.1;
    const path = new Path2D();
    path.rect(-w / 2, -h / 2, w, h);
    g.save();
    g.translate(x, y);
    g.rotate(s.tilt);
    solid(g, path, WHITE, a, r);
    g.fillStyle = ink(a);
    let cx = -w / 2 + w * 0.08;
    let n = Math.floor(s.pick * 1e6);
    while (cx < w / 2 - w * 0.1) {
      const bar = 1 + (n % 4);
      n = (n * 1103515245 + 12345) >>> 0;
      g.fillRect(cx, -h / 2 + h * 0.1, bar * (w / 70), h * 0.58);
      cx += bar * (w / 70) + (1 + (n % 3)) * (w / 70);
    }
    g.font = `700 ${r * 0.14}px 'Martian Mono', 'JetBrains Mono', monospace`;
    g.textAlign = "center";
    g.fillText(String(Math.floor(s.pick * 9e11) + 1e11).slice(0, 12).replace(/(\d{1})(\d{6})(\d{5})/, "$1 $2 $3"), 0, h * 0.4);
    g.restore();
  }),

  // A rubber stamp: a word in a thick frame, a little crooked.
  kind("stamp", { weight: 1.8, radius: [70, 120], max: 2 }, (g, s, _e, x, y, r, a) => {
    const words = ["APPROVED", "VOID", "FINAL", "DRAFT", "RAW"];
    const word = words[Math.floor(s.pick * 997) % words.length];
    const colour: Rgb = s.pick < 0.5 ? [230, 30, 40] : INK;
    g.save();
    g.translate(x, y);
    g.rotate(-0.22 + s.tilt * 0.6);
    g.strokeStyle = css(colour, a * 0.9);
    g.lineWidth = Math.max(4, r * 0.08);
    const w = r * 1.7;
    const h = r * 0.62;
    g.strokeRect(-w / 2, -h / 2, w, h);
    g.lineWidth = Math.max(2, r * 0.03);
    g.strokeRect(-w / 2 + r * 0.07, -h / 2 + r * 0.07, w - r * 0.14, h - r * 0.14);
    g.globalAlpha = a * 0.9;
    label(g, word, r * 0.28, css(colour));
    g.restore();
  }),

  // A sticky note with a folded corner and some scribble.
  kind("sticky", { weight: 1.8, radius: [60, 100], max: 2 }, (g, s, _e, x, y, r, a) => {
    const w = r * 1.5;
    const fold = w * 0.22;
    const path = new Path2D();
    path.moveTo(-w / 2, -w / 2);
    path.lineTo(w / 2, -w / 2);
    path.lineTo(w / 2, w / 2 - fold);
    path.lineTo(w / 2 - fold, w / 2);
    path.lineTo(-w / 2, w / 2);
    path.closePath();
    g.save();
    g.translate(x, y);
    g.rotate(s.tilt * 1.2);
    solid(g, path, s.pick < 0.5 ? CONCRETE : ORANGE, a, r);
    g.fillStyle = ink(a * 0.85);
    g.beginPath();
    g.moveTo(w / 2 - fold, w / 2);
    g.lineTo(w / 2, w / 2 - fold);
    g.lineTo(w / 2 - fold, w / 2 - fold);
    g.closePath();
    g.fill();
    g.strokeStyle = ink(a);
    g.lineWidth = Math.max(3, r * 0.05);
    g.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      const yy = -w * 0.22 + i * w * 0.2;
      g.moveTo(-w * 0.32, yy);
      for (let k = 1; k <= 6; k++) g.lineTo(-w * 0.32 + k * w * 0.1, yy + (k % 2 ? -1 : 1) * w * 0.04);
      g.stroke();
    }
    g.restore();
  }),

  // A halftone disc: dots that grow across it.
  kind("halftone", { weight: 1.8, radius: [80, 140], depth: [0.5, 0.8], reach: 1.1 }, (g, _s, _e, x, y, r, a) => {
    const step = r * 0.14;
    g.save();
    g.translate(x, y);
    g.fillStyle = ink(a * 0.85);
    for (let iy = -r; iy <= r; iy += step) {
      for (let ix = -r; ix <= r; ix += step) {
        const ox = ix + (Math.round(iy / step) % 2 ? step / 2 : 0);
        const d = Math.hypot(ox, iy);
        if (d > r) continue;
        const size = step * 0.55 * (1 - d / r * 0.85);
        g.beginPath();
        g.arc(ox, iy, size, 0, TAU);
        g.fill();
      }
    }
    g.restore();
  }),

  // An asterisk that clicks round in steps.
  kind("asterisk", { weight: 2, radius: [50, 90] }, (g, s, e, x, y, r, a) => {
    const arms = 8;
    const path = new Path2D();
    for (let i = 0; i < arms; i++) {
      const ang = (i / arms) * TAU;
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      const hw = r * 0.14;
      path.moveTo(-sn * hw, c * hw);
      path.lineTo(c * r - sn * hw, sn * r + c * hw);
      path.lineTo(c * r + sn * hw, sn * r - c * hw);
      path.lineTo(sn * hw, -c * hw);
      path.closePath();
    }
    g.save();
    g.translate(x, y);
    g.rotate(ticks(e.t, 4) * 0.4 + s.ph);
    solid(g, path, s.pick < 0.5 ? (e.accent) : INK, a, r);
    g.restore();
  }),

  // A big pointer cursor.
  kind("pointer", { weight: 1.6, radius: [70, 120], max: 2 }, (g, s, e, x, y, r, a) => {
    const k = r * 1.5;
    const path = new Path2D();
    const pts: Array<[number, number]> = [[0, 0], [0, 0.85], [0.2, 0.67], [0.34, 1.0], [0.5, 0.93], [0.37, 0.61], [0.62, 0.61]];
    pts.forEach(([px, py], i) => path[i ? "lineTo" : "moveTo"](px * k - k * 0.3, py * k - k * 0.5));
    path.closePath();
    g.save();
    g.translate(x, y + Math.sin(ticks(e.t, 3) * 2 + s.ph) * 5);
    g.rotate(s.tilt * 0.5);
    solid(g, path, WHITE, a, r);
    g.restore();
  }),

  // A numbered badge.
  kind("badge", { weight: 1.6, radius: [44, 76] }, (g, s, _e, x, y, r, a) => {
    const path = new Path2D();
    path.arc(0, 0, r, 0, TAU);
    g.save();
    g.translate(x, y);
    solid(g, path, s.pick < 0.5 ? INK : ORANGE, a, r);
    g.globalAlpha = a;
    label(g, String(Math.floor(s.pick * 97) % 9 + 1).padStart(2, "0"), r * 0.9, css(CREAM));
    g.restore();
  }),
];


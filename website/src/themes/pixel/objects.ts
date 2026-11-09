import type { SceneEnv } from "../shared/scene/types";
import type { Kind } from "../shared/scene/world";
import { sprite, type SpriteId } from "./sprites";

const TAU = Math.PI * 2;

/** The same sprite as a flat dark silhouette, for the hard shadow every object throws. */
const silhouettes = new Map<SpriteId, HTMLCanvasElement>();
function silhouette(id: SpriteId): HTMLCanvasElement {
  const hit = silhouettes.get(id);
  if (hit) return hit;
  const s = sprite(id);
  const c = document.createElement("canvas");
  c.width = s.w;
  c.height = s.h;
  const g = c.getContext("2d")!;
  g.drawImage(s.canvas, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = "#000";
  g.fillRect(0, 0, s.w, s.h);
  silhouettes.set(id, c);
  return c;
}

/** A whole-number scale that makes the sprite about 2r across. */
const scaleFor = (id: SpriteId, r: number) => {
  const s = sprite(id);
  return Math.max(2, Math.round((r * 2) / Math.max(s.w, s.h)));
};

interface Pose {
  /** Squash and stretch, 1 is the drawn shape. */
  sx?: number;
  sy?: number;
  /** Offsets in sprite pixels (they snap to whole pixels, so motion steps like a game). */
  dx?: number;
  dy?: number;
  alpha?: number;
  shadow?: boolean;
}

/** Paints a sprite centred on (x, y) with whole-pixel steps, a hard drop shadow and an optional pose. */
function stamp(g: CanvasRenderingContext2D, id: SpriteId, x: number, y: number, r: number, a: number, pose: Pose = {}) {
  const s = sprite(id);
  const k = scaleFor(id, r);
  const w = Math.max(k, Math.round(s.w * k * (pose.sx ?? 1)));
  const h = Math.max(k, Math.round(s.h * k * (pose.sy ?? 1)));
  const px = Math.round(x - w / 2 + (pose.dx ?? 0) * k);
  const py = Math.round(y - h / 2 + (pose.dy ?? 0) * k);
  g.imageSmoothingEnabled = false;
  if (pose.shadow !== false) {
    g.globalAlpha = a * 0.28;
    g.drawImage(silhouette(id), px + k * 1.5, py + k * 1.5, w, h);
  }
  g.globalAlpha = a * (pose.alpha ?? 1);
  g.drawImage(s.canvas, px, py, w, h);
  g.globalAlpha = 1;
}

/** A four-point sparkle made of square pixels. */
function sparkle(g: CanvasRenderingContext2D, x: number, y: number, k: number, size: number, color: string, a: number) {
  g.globalAlpha = a;
  g.fillStyle = color;
  const px = Math.round(x);
  const py = Math.round(y);
  g.fillRect(px - k, py - k, k, k);
  for (let i = 1; i <= size; i++) {
    g.fillRect(px - k - i * k, py - k, k, k);
    g.fillRect(px + i * k, py - k, k, k);
    g.fillRect(px - k, py - k - i * k, k, k);
    g.fillRect(px - k, py + i * k, k, k);
  }
  g.globalAlpha = 1;
}

/** Steps a smooth value to whole pixels of motion, so things move like a game does. */
const step = (v: number) => Math.round(v);

interface Phase {
  ph: number;
  rate: number;
}
const phase = (rnd: () => number): Phase => ({ ph: rnd() * TAU, rate: 0.8 + rnd() * 0.6 });

function simple(id: SpriteId, over: Partial<Kind<Phase>>, motion: (g: CanvasRenderingContext2D, s: Phase, e: SceneEnv, x: number, y: number, r: number, a: number) => void): Kind<Phase> {
  return {
    id,
    weight: 2,
    radius: [34, 64],
    depth: [0.8, 1],
    reach: 1.2,
    make: (rnd) => phase(rnd),
    draw: motion,
    ...over,
  };
}

export const kinds: Kind[] = [
  // A spinning coin: it narrows to an edge and widens again, and sparkles at the top of every turn.
  simple("coin", { weight: 3.4, max: 3, radius: [26, 46], zone: "side" }, (g, s, e, x, y, r, a) => {
    const spin = Math.cos(e.t * 2.4 * s.rate + s.ph);
    const k = scaleFor("coin", r);
    stamp(g, "coin", x, y, r, a, { sx: Math.max(0.14, Math.abs(spin)), dy: step(Math.sin(e.t * 1.6 + s.ph) * 1.4) });
    if (Math.abs(spin) > 0.93) sparkle(g, x + r * 0.7, y - r * 0.8, k, 2, "#fff3b0", a * 0.9);
  }) as Kind,

  // A heart that beats: a quick double pulse, then rest.
  simple("heart", { weight: 2.2, radius: [30, 54] }, (g, s, e, x, y, r, a) => {
    const t = (e.t * 0.9 * s.rate + s.ph) % 1;
    const beat = t < 0.12 ? t / 0.12 : t < 0.24 ? 1 - (t - 0.12) / 0.12 : t < 0.34 ? (t - 0.24) / 0.1 * 0.7 : t < 0.46 ? 0.7 * (1 - (t - 0.34) / 0.12) : 0;
    stamp(g, "heart", x, y, r, a, { sx: 1 + beat * 0.12, sy: 1 + beat * 0.12, dy: step(Math.sin(e.t + s.ph) * 1) });
  }) as Kind,

  // A star that hovers and throws sparkles.
  simple("star", { weight: 2, radius: [30, 56], zone: "side" }, (g, s, e, x, y, r, a) => {
    const k = scaleFor("star", r);
    stamp(g, "star", x, y, r, a, { dy: step(Math.sin(e.t * 1.4 + s.ph) * 1.6) });
    for (let i = 0; i < 3; i++) {
      const t = (e.t * 0.7 + s.ph + i / 3) % 1;
      const ang = s.ph + i * 2.1;
      sparkle(g, x + Math.cos(ang) * r * 1.15, y + Math.sin(ang) * r * 1.0, k, t < 0.5 ? 1 : 2, "#fff3b0", Math.sin(t * Math.PI) * 0.9 * a);
    }
  }) as Kind,

  // A mushroom that stands on the edge of a card and bounces on the spot now and then.
  simple("mushroom", { weight: 1.8, radius: [34, 60], anchor: "ledge", depth: [1, 1], max: 2 }, (g, s, e, x, y, r, a) => {
    const t = (e.t * 0.5 * s.rate + s.ph) % 3;
    const hop = t < 0.5 ? Math.sin((t / 0.5) * Math.PI) : 0;
    const squash = t > 0.5 && t < 0.62 ? 0.12 : 0;
    stamp(g, "mushroom", x, y, r, a, { dy: -step(hop * 5), sy: 1 - squash, sx: 1 + squash * 0.8 });
  }) as Kind,

  // A slime that jumps: squashes, springs up and lands.
  simple("slime", { weight: 1.8, radius: [34, 58], anchor: "ledge", depth: [1, 1], max: 2 }, (g, s, e, x, y, r, a) => {
    const t = (e.t * 0.45 * s.rate + s.ph) % 1;
    let sy = 1;
    let dy = 0;
    if (t < 0.12) sy = 1 - (t / 0.12) * 0.25;
    else if (t < 0.5) {
      const u = (t - 0.12) / 0.38;
      dy = -Math.sin(u * Math.PI) * 7;
      sy = 1.12 - Math.abs(u - 0.5) * 0.2;
    } else if (t < 0.6) sy = 0.78 + ((t - 0.5) / 0.1) * 0.22;
    stamp(g, "slime", x, y, r, a, { sy, sx: 2 - sy > 1.2 ? 1.2 : 2 - sy, dy: step(dy) });
  }) as Kind,

  // A treasure chest that sits on a card, its gold winking.
  simple("chest", { weight: 1.5, radius: [36, 62], anchor: "ledge", depth: [1, 1], max: 1 }, (g, s, e, x, y, r, a) => {
    const k = scaleFor("chest", r);
    stamp(g, "chest", x, y, r, a);
    const t = (e.t * 0.6 + s.ph) % 1;
    if (t < 0.5) sparkle(g, x + r * 0.2, y - r * 0.1, k, t < 0.25 ? 1 : 2, "#fff3b0", Math.sin(t * 2 * Math.PI) * a);
  }) as Kind,

  // A small tree, planted on a card.
  simple("tree", { weight: 1.6, radius: [40, 70], anchor: "ledge", depth: [1, 1], max: 3 }, (g, s, e, x, y, r, a) => {
    stamp(g, "tree", x, y, r, a, { sx: 1 + step(Math.sin(e.t * 0.8 + s.ph) * 0.6) * 0.02 });
  }) as Kind,

  // A "?" block that rises a little and drops, as if it had just been hit.
  simple("block", { weight: 1.4, radius: [34, 56], max: 2 }, (g, s, e, x, y, r, a) => {
    const t = (e.t * 0.35 * s.rate + s.ph) % 1;
    const bump = t < 0.1 ? Math.sin((t / 0.1) * Math.PI) * 3 : 0;
    stamp(g, "block", x, y, r, a, { dy: -step(bump) });
  }) as Kind,

  // A key and a sword drifting slowly, turning with the motion.
  simple("key", { weight: 1.3, radius: [34, 58], max: 1 }, (g, s, e, x, y, r, a) => {
    stamp(g, "key", x, y, r, a, { dy: step(Math.sin(e.t * 1.1 + s.ph) * 2), dx: step(Math.cos(e.t * 0.7 + s.ph)) });
  }) as Kind,
  simple("sword", { weight: 1.3, radius: [38, 64], max: 1 }, (g, s, e, x, y, r, a) => {
    const k = scaleFor("sword", r);
    stamp(g, "sword", x, y, r, a, { dy: step(Math.sin(e.t * 0.9 + s.ph) * 2) });
    const t = (e.t * 0.5 + s.ph) % 1;
    if (t < 0.3) sparkle(g, x + r * 0.6, y - r * 0.7, k, 1 + (t > 0.15 ? 1 : 0), "#ffffff", Math.sin((t / 0.3) * Math.PI) * a);
  }) as Kind,

  // A potion with bubbles rising out of it.
  simple("potion", { weight: 1.5, radius: [32, 54], max: 2 }, (g, s, e, x, y, r, a) => {
    const k = scaleFor("potion", r);
    stamp(g, "potion", x, y, r, a, { dy: step(Math.sin(e.t * 1.2 + s.ph) * 1.4) });
    for (let i = 0; i < 3; i++) {
      const t = (e.t * 0.5 + s.ph + i / 3) % 1;
      g.fillStyle = "#e6d4ff";
      g.globalAlpha = (1 - t) * a * 0.9;
      g.fillRect(Math.round(x - k * 1 + Math.sin(t * 6 + i) * k * 2), Math.round(y - r * 0.9 - t * r * 0.9), k * (i === 1 ? 2 : 1), k * (i === 1 ? 2 : 1));
      g.globalAlpha = 1;
    }
  }) as Kind,

  // A ghost, fading in and out as it floats.
  simple("ghost", { weight: 1.5, radius: [38, 62], max: 2, zone: "side" }, (g, s, e, x, y, r, a) => {
    stamp(g, "ghost", x, y, r, a, { dy: step(Math.sin(e.t * 1.1 + s.ph) * 3), dx: step(Math.cos(e.t * 0.6 + s.ph) * 1.5), alpha: 0.65 + 0.3 * Math.sin(e.t * 1.3 + s.ph), shadow: false });
  }) as Kind,

  // A gem that glints: a bright diagonal sweeps across it.
  simple("gem", { weight: 1.6, radius: [30, 52], max: 2 }, (g, s, e, x, y, r, a) => {
    const k = scaleFor("gem", r);
    stamp(g, "gem", x, y, r, a, { dy: step(Math.sin(e.t * 1.3 + s.ph) * 1.5) });
    const t = (e.t * 0.55 + s.ph) % 1;
    if (t < 0.35) sparkle(g, x - r * 0.45 + (t / 0.35) * r * 0.9, y - r * 0.3, k, 1 + (t > 0.12 && t < 0.24 ? 1 : 0), "#ffffff", Math.sin((t / 0.35) * Math.PI) * a);
  }) as Kind,

  // Big drifting clouds, behind everything else.
  {
    id: "cloud",
    weight: 2.4,
    radius: [70, 130],
    depth: [0.35, 0.6],
    reach: 1.4,
    max: 3,
    make: (rnd) => ({ ph: rnd() * TAU, rate: 4 + rnd() * 6 }),
    draw(g, s, e, x, y, r, a) {
      const st = s as Phase;
      const drift = ((st.ph * 40 + e.t * st.rate) % 60) - 30;
      stamp(g, "cloud", x + drift, y, r, a * (e.light ? 0.9 : 0.35), { shadow: false });
    },
  } as Kind,
];

import { createOverlay } from "../shared/scene/overlay";
import type { Rgb, SceneEnv } from "../shared/scene/types";

/** What the Brutalist cursor leaves behind: a trail of hard squares in ink and red that shrink as they go, and an
 * impact where you click: a square frame that expands and thins to nothing, short rays that shoot out, and a few
 * square shards. It is quick (a third of a second) and eased, so it pops and melts away instead of lingering. */
const TAU = Math.PI * 2;
const stateOf = () => document.querySelector<HTMLElement>(".theme-cursor")?.dataset.state ?? "default";
const css = (c: Rgb, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

const LIFE = 0.38;
const RAYS = 8;
const SHARDS = 6;

interface Square {
  x: number;
  y: number;
  born: number;
  color: Rgb;
  size: number;
}

interface Impact {
  x: number;
  y: number;
  born: number;
  /** A link click is a little bigger; a refused one is all red. */
  power: number;
  refused: boolean;
  turn: number;
}

export function createCursorFx() {
  const overlay = createOverlay();
  const squares: Square[] = [];
  const impacts: Impact[] = [];
  let lastX = -1e4;
  let lastY = -1e4;
  let flip = false;

  const impact = (g: CanvasRenderingContext2D, e: SceneEnv, s: Impact) => {
    const t = Math.min(1, (e.t - s.born) / LIFE);
    const k = easeOut(t);
    const soft = (1 - t) * (1 - t);
    const ink = s.refused ? e.accent : e.text;
    const hot = e.accent;
    g.save();
    g.translate(s.x, s.y);
    g.lineJoin = "miter";
    g.lineCap = "butt";

    // a red square that swells a little and is gone by half time
    const fill = (10 + k * 26 * s.power) * 2;
    g.fillStyle = css(hot, 0.4 * Math.max(0, 1 - t * 2));
    g.rotate(s.turn);
    g.fillRect(-fill / 2, -fill / 2, fill, fill);

    // the frame: it opens out and its edge thins to nothing
    const size = (16 + k * 64 * s.power) * 1;
    g.strokeStyle = css(ink, 0.95 * (1 - t * t));
    g.lineWidth = Math.max(0.5, 6 * (1 - k) + 1);
    g.strokeRect(-size / 2, -size / 2, size, size);
    g.rotate(-s.turn);

    // rays: short bars that fly outward and shorten
    for (let i = 0; i < RAYS; i++) {
      const a = (i / RAYS) * TAU + s.turn;
      const from = 12 + k * 34 * s.power;
      const to = from + (18 * s.power) * (1 - k) + 4;
      g.strokeStyle = css(i % 2 ? ink : hot, 0.95 * (1 - t * t));
      g.lineWidth = 4 * (1 - t) + 1;
      g.beginPath();
      g.moveTo(Math.cos(a) * from, Math.sin(a) * from);
      g.lineTo(Math.cos(a) * to, Math.sin(a) * to);
      g.stroke();
    }

    // shards: little squares that scatter between the rays and spin away
    for (let i = 0; i < SHARDS; i++) {
      const a = ((i + 0.5) / SHARDS) * TAU + s.turn * 1.7;
      const dist = 20 + k * (44 + (i % 3) * 8) * s.power;
      const sz = 8 * (1 - k) + 2;
      g.save();
      g.translate(Math.cos(a) * dist, Math.sin(a) * dist);
      g.rotate(a + k * 2.2);
      g.fillStyle = css(i % 2 ? hot : ink, 1 - soft * 0.2 - t * 0.8);
      g.fillRect(-sz / 2, -sz / 2, sz, sz);
      g.restore();
    }
    g.restore();
  };

  return {
    frame(e: SceneEnv) {
      const g = overlay.begin(e);
      if (!g || e.still) return;
      // the trail: hard squares, alternating ink and red, shrinking smoothly
      if (e.seen && stateOf() !== "field" && Math.hypot(e.rx - lastX, e.ry - lastY) > 20) {
        lastX = e.rx;
        lastY = e.ry;
        flip = !flip;
        squares.push({ x: e.rx, y: e.ry, born: e.t, color: flip ? e.text : e.accent, size: 12 });
      }
      for (let i = squares.length - 1; i >= 0; i--) {
        const q = squares[i];
        const age = (e.t - q.born) / 0.45;
        if (age >= 1) {
          squares.splice(i, 1);
          continue;
        }
        const size = Math.max(1, q.size * (1 - age * age));
        g.fillStyle = css(q.color, 1 - age * 0.6);
        g.fillRect(q.x - size / 2, q.y - size / 2, size, size);
      }
      for (let i = impacts.length - 1; i >= 0; i--) {
        if (e.t - impacts[i].born >= LIFE) {
          impacts.splice(i, 1);
          continue;
        }
        impact(g, e, impacts[i]);
      }
    },
    destroy: () => overlay.destroy(),
    press(x: number, y: number, e: SceneEnv) {
      if (e.still) return;
      const state = stateOf();
      if (state === "field") return;
      impacts.push({ x, y, born: e.t, power: state === "link" ? 1.2 : 1, refused: state === "no", turn: Math.random() * 0.8 });
    },
  };
}

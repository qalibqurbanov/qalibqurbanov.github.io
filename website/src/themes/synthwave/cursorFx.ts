import { createOverlay } from "../shared/scene/overlay";
import type { SceneEnv } from "../shared/scene/types";
import { rgba } from "../shared/scene/util";

/** A click in Synthwave: light trails. Two pairs of neon lines shoot away from the click along the horizon, one to each
 * side, the pink pair a little above the cyan pair, each with a bright head and a tail that fades behind it, over a
 * brief flash of the point itself. Drawn additively, so the lines glow. */
const LIFE = 0.5;
const easeOut = (t: number) => 1 - (1 - t) ** 4;

interface Streak {
  x: number;
  y: number;
  born: number;
}

export function createCursorFx() {
  const overlay = createOverlay();
  const streaks: Streak[] = [];
  return {
    frame(e: SceneEnv) {
      const g = overlay.begin(e);
      if (!g || e.still) return;
      g.globalCompositeOperation = "lighter";
      g.lineCap = "round";
      for (let i = streaks.length - 1; i >= 0; i--) {
        const s = streaks[i];
        const t = (e.t - s.born) / LIFE;
        if (t >= 1) {
          streaks.splice(i, 1);
          continue;
        }
        const k = easeOut(t);
        const fade = 1 - t;
        // [side, vertical offset, colour, reach, thickness]
        const lines: Array<[number, number, [number, number, number], number, number]> = [
          [-1, -5, e.accent, 150, 2],
          [1, -5, e.accent, 120, 2],
          [-1, 5, e.accent2, 110, 1.5],
          [1, 5, e.accent2, 160, 1.5],
        ];
        g.shadowBlur = 14;
        for (const [side, dy, colour, reach, width] of lines) {
          const head = s.x + side * k * reach;
          const tail = s.x + side * Math.max(0, k - 0.45 - t * 0.2) * reach;
          const grad = g.createLinearGradient(tail, 0, head, 0);
          grad.addColorStop(0, rgba(colour, 0));
          grad.addColorStop(1, rgba(colour, 0.95 * fade + 0.05));
          g.shadowColor = rgba(colour, 0.9);
          g.strokeStyle = grad;
          g.lineWidth = width;
          g.beginPath();
          g.moveTo(tail, s.y + dy);
          g.lineTo(head, s.y + dy);
          g.stroke();
        }
        // a short vertical flash at the point
        if (t < 0.22) {
          const f = 1 - t / 0.22;
          g.shadowColor = rgba(e.accent2, 1);
          g.strokeStyle = rgba(e.text, f);
          g.lineWidth = 1.5;
          g.beginPath();
          g.moveTo(s.x, s.y - 14 * f - 3);
          g.lineTo(s.x, s.y + 14 * f + 3);
          g.stroke();
        }
      }
      g.shadowBlur = 0;
      g.globalCompositeOperation = "source-over";
    },
    press(x: number, y: number, e: SceneEnv) {
      if (!e.still) streaks.push({ x, y, born: e.t });
    },
    destroy: () => overlay.destroy(),
  };
}

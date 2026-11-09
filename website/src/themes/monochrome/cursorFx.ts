import { createOverlay } from "../shared/scene/overlay";
import type { SceneEnv } from "../shared/scene/types";

/** A click in Monochrome: a registration mark. A hairline plus grows long from the click and turns an eighth of a turn into
 * an x as it thins away, with a single pixel left at the centre for a moment. Drawn with `difference` like the cursor,
 * so it inverts whatever it crosses: black on white, white on black. Nothing round, nothing coloured. */
const LIFE = 0.55;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

interface Mark {
  x: number;
  y: number;
  born: number;
}

export function createCursorFx() {
  const overlay = createOverlay();
  const marks: Mark[] = [];
  return {
    frame(e: SceneEnv) {
      const g = overlay.begin(e);
      if (!g || e.still) return;
      g.globalCompositeOperation = "difference";
      g.strokeStyle = "#fff";
      g.fillStyle = "#fff";
      g.lineCap = "butt";
      for (let i = marks.length - 1; i >= 0; i--) {
        const m = marks[i];
        const t = (e.t - m.born) / LIFE;
        if (t >= 1) {
          marks.splice(i, 1);
          continue;
        }
        const reach = 6 + easeOut(t) * 46;
        g.save();
        g.translate(m.x, m.y);
        g.rotate(easeInOut(t) * (Math.PI / 4));
        g.globalAlpha = 1 - t * t;
        g.lineWidth = 1;
        const gap = 3;
        g.beginPath();
        g.moveTo(-reach, 0);
        g.lineTo(-gap, 0);
        g.moveTo(gap, 0);
        g.lineTo(reach, 0);
        g.moveTo(0, -reach);
        g.lineTo(0, -gap);
        g.moveTo(0, gap);
        g.lineTo(0, reach);
        g.stroke();
        g.restore();
        if (t < 0.4) {
          g.globalAlpha = 1 - t / 0.4;
          g.fillRect(Math.round(m.x) - 1, Math.round(m.y) - 1, 2, 2);
        }
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    },
    press(x: number, y: number, e: SceneEnv) {
      if (!e.still) marks.push({ x, y, born: e.t });
    },
    destroy: () => overlay.destroy(),
  };
}

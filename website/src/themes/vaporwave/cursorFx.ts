import { createOverlay } from "../shared/scene/overlay";
import type { SceneEnv } from "../shared/scene/types";
import { rgba } from "../shared/scene/util";

/** A click in Vaporwave: a dialog opens. Three hollow windows, each with its title bar, unfold from the click one
 * after another and slide a step apart, in the two pastel accents, then fade. Everything sits on the 8px grid and
 * moves in a few steps, like an old desktop drawing its windows. */
const GRID = 8;
const LIFE = 0.62;
const STEPS = 6;
const snap = (v: number) => Math.round(v / GRID) * GRID;
const stepped = (t: number) => Math.round(Math.min(1, Math.max(0, t)) * STEPS) / STEPS;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

interface Open {
  x: number;
  y: number;
  born: number;
}

export function createCursorFx() {
  const overlay = createOverlay();
  const opens: Open[] = [];
  return {
    frame(e: SceneEnv) {
      const g = overlay.begin(e);
      if (!g || e.still) return;
      for (let i = opens.length - 1; i >= 0; i--) {
        const o = opens[i];
        const age = (e.t - o.born) / LIFE;
        if (age >= 1) {
          opens.splice(i, 1);
          continue;
        }
        for (let n = 0; n < 3; n++) {
          // each window starts a little after the last
          const local = (age - n * 0.12) / 0.7;
          if (local <= 0) continue;
          const k = stepped(easeOut(Math.min(1, local)));
          const fade = local > 0.6 ? Math.max(0, 1 - (local - 0.6) / 0.4) : 1;
          const w = snap(16 + k * 40);
          const h = snap(w * 0.72);
          const x = snap(o.x) - w / 2 + n * GRID * k;
          const y = snap(o.y) - h / 2 + n * GRID * k;
          const colour = n === 1 ? e.accent : n === 0 ? e.accent2 : e.text;
          g.globalAlpha = fade * (n === 2 ? 0.55 : 0.95);
          // a hard shadow, then the frame and its title bar
          g.fillStyle = rgba(e.bg, 0.5);
          g.fillRect(x + 4, y + 4, w, h);
          g.fillStyle = rgba(colour, 1);
          g.fillRect(x, y, w, 2);
          g.fillRect(x, y + h - 2, w, 2);
          g.fillRect(x, y, 2, h);
          g.fillRect(x + w - 2, y, 2, h);
          g.fillRect(x, y, w, 8);
          g.fillStyle = rgba(e.bg, 1);
          g.fillRect(x + w - 6, y + 2, 4, 4);
        }
      }
      g.globalAlpha = 1;
    },
    press(x: number, y: number, e: SceneEnv) {
      if (!e.still) opens.push({ x, y, born: e.t });
    },
    destroy: () => overlay.destroy(),
  };
}

import { createOverlay } from "../shared/scene/overlay";
import type { SceneEnv } from "../shared/scene/types";

/** What the Pixel Quest cursor leaves behind, drawn on the objects canvas in whole 4px squares: a trail of
 * sparks (their colour says what the cursor is over: white-blue on the page, gold over a link, green over a
 * draggable thing, red over a disabled one), and a burst of sparks with a floating "+1" when you click. */
const STEP = 4;
const PALETTES: Record<string, string[]> = {
  default: ["#ffffff", "#cfe8ff", "#8fd3ff"],
  link: ["#ffd23f", "#fff3b0", "#f4902c"],
  grab: ["#66d36e", "#c8ffd0", "#2ea44f"],
  no: ["#e63946", "#ff8fa3", "#a4161a"],
  field: [],
};

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
  size: number;
  color: string;
  gravity: number;
}

interface Pop {
  x: number;
  y: number;
  born: number;
  text: string;
  color: string;
}

const snap = (v: number) => Math.round(v / STEP) * STEP;
const stateOf = () => document.querySelector<HTMLElement>(".theme-cursor")?.dataset.state ?? "default";

export function createCursorFx() {
  const overlay = createOverlay();
  const sparks: Spark[] = [];
  const pops: Pop[] = [];
  let lastX = -1e4;
  let lastY = -1e4;

  const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];

  return {
    frame(e: SceneEnv) {
      const g = overlay.begin(e);
      if (!g || e.still) return;
      const palette = PALETTES[stateOf()] ?? PALETTES.default;
      // the trail: a spark every so often along the path, falling a little as it fades
      if (e.seen && palette.length && Math.hypot(e.rx - lastX, e.ry - lastY) > 16) {
        lastX = e.rx;
        lastY = e.ry;
        sparks.push({ x: e.rx, y: e.ry, vx: (Math.random() - 0.5) * 30, vy: -10 + Math.random() * 20, born: e.t, life: 0.55, size: Math.random() < 0.3 ? STEP * 2 : STEP, color: pick(palette), gravity: 90 });
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        const age = (e.t - s.born) / s.life;
        if (age >= 1) {
          sparks.splice(i, 1);
          continue;
        }
        s.vy += s.gravity * e.dt;
        s.x += s.vx * e.dt;
        s.y += s.vy * e.dt;
        // fade and shrink in whole steps, like a sprite with a few frames
        const step = Math.floor(age * 4) / 4;
        const size = step > 0.5 ? STEP : s.size;
        g.globalAlpha = 1 - step * 0.85;
        g.fillStyle = s.color;
        g.fillRect(snap(s.x), snap(s.y), size, size);
      }
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        const age = (e.t - p.born) / 0.9;
        if (age >= 1) {
          pops.splice(i, 1);
          continue;
        }
        const y = snap(p.y - Math.min(1, age * 1.6) * 28);
        g.globalAlpha = age > 0.7 ? 1 - (age - 0.7) / 0.3 : 1;
        g.font = "10px 'Press Start 2P', monospace";
        g.textAlign = "center";
        g.fillStyle = "#1b1033";
        g.fillText(p.text, snap(p.x) + 2, y + 2);
        g.fillStyle = p.color;
        g.fillText(p.text, snap(p.x), y);
      }
      g.globalAlpha = 1;
    },
    /** A click: a burst of sparks flying out and falling, and a "+1" over something you can use. */
    destroy: () => overlay.destroy(),
    press(x: number, y: number, e: SceneEnv) {
      if (e.still) return;
      const state = stateOf();
      const palette = PALETTES[state] ?? PALETTES.default;
      if (!palette.length) return;
      const count = state === "link" ? 16 : 10;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 90 + Math.random() * 130;
        sparks.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 60, born: e.t, life: 0.75, size: Math.random() < 0.4 ? STEP * 2 : STEP, color: pick(palette), gravity: 520 });
      }
      if (state === "link") pops.push({ x, y: y - 14, born: e.t, text: "+1", color: "#ffd23f" });
      if (state === "no") pops.push({ x, y: y - 14, born: e.t, text: "NO", color: "#e63946" });
    },
  };
}

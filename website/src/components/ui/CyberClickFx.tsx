import { useEffect } from "react";

const LIFE = 0.6;
const BARS = 5;

interface Bar {
  dy: number;
  dx: number;
  len: number;
  colour: 0 | 1;
}

interface Hit {
  x: number;
  y: number;
  born: number;
  bars: Bar[];
}

/** A click in the original (Cyber) style: a data glitch. A few thin horizontal bars tear out of the click point,
 * flickering and shifting for a moment as if the screen had skipped, and a small coordinate tag types itself next to it
 * and fades. The cursor itself is untouched. */
export function CyberClickFx() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:2147482000;";
    document.body.appendChild(canvas);
    const g = canvas.getContext("2d");
    if (!g) return;
    const hits: Hit[] = [];
    let frame = 0;
    let accent = "177,133,255";
    let accent2 = "216,180,254";

    const rgb = (name: string, fallback: string) => {
      const m = getComputedStyle(document.documentElement).getPropertyValue(name).trim().match(/^#([0-9a-f]{6})$/i);
      if (!m) return fallback;
      const n = parseInt(m[1], 16);
      return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
    };

    const draw = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      g.font = "10px 'JetBrains Mono', ui-monospace, monospace";
      g.textBaseline = "alphabetic";
      for (let i = hits.length - 1; i >= 0; i--) {
        const p = hits[i];
        const t = (now - p.born) / 1000 / LIFE;
        if (t >= 1) {
          hits.splice(i, 1);
          continue;
        }
        // the bars jump to a new offset every ~50ms and drop out in bursts, like a glitching signal
        const tick = Math.floor(t * 12);
        for (let n = 0; n < p.bars.length; n++) {
          const bar = p.bars[n];
          const on = (tick * 7 + n * 3) % 4 !== 0 && t < 0.8;
          if (!on) continue;
          const jitter = (((tick * 13 + n * 5) % 7) - 3) * 3;
          const len = bar.len * (1 - t * 0.6);
          g.fillStyle = `rgba(${bar.colour ? accent2 : accent},${0.9 * (1 - t)})`;
          g.fillRect(p.x + bar.dx + jitter, p.y + bar.dy, len, 2);
        }
        // the coordinate tag types itself out in the first fifth, then fades
        const text = `${Math.round(p.x)}:${Math.round(p.y)}`;
        const shown = Math.min(text.length, Math.ceil((t / 0.2) * text.length));
        g.fillStyle = `rgba(${accent2},${t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4})`;
        g.fillText(text.slice(0, shown), p.x + 12, p.y - 10);
        g.fillRect(p.x + 8, p.y - 14, 1, 10);
      }
      frame = hits.length ? requestAnimationFrame(draw) : 0;
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || document.documentElement.getAttribute("data-motion") === "off") return;
      accent = rgb("--color-accent", accent);
      accent2 = rgb("--color-accent-2", accent2);
      const bars: Bar[] = Array.from({ length: BARS }, (_, i) => ({
        dy: (i - (BARS - 1) / 2) * 5 + (Math.random() - 0.5) * 3,
        dx: (Math.random() - 0.3) * 24,
        len: 18 + Math.random() * 56,
        colour: i % 2 ? 1 : 0,
      }));
      hits.push({ x: event.clientX, y: event.clientY, born: performance.now(), bars });
      if (!frame) frame = requestAnimationFrame(draw);
    };

    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onDown);
      cancelAnimationFrame(frame);
      canvas.remove();
    };
  }, []);

  return null;
}

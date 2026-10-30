import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/hooks/glitch";
import { rand } from "@/lib/math";
import { setScanBand } from "@/lib/scanBand";
import { subscribeTick } from "@/lib/ticker";
import { useMotion } from "@/motion/context";
import { useStyle } from "@/themes/shared/style/context";

/** Must match the cell size of `.bg-grid`. */
const CELL = 44;
/** Half the width of the scan band, in px, measured along its diagonal. */
const BAND = 280;
/** Pixels per millisecond the band travels. */
const BAND_SPEED = 0.15;
/** Where each pass enters, going round like a clock (bit 1 = right, bit 2 = bottom): top-left,
 * top-right, bottom-right, bottom-left. The band crosses to the opposite corner. */
const CLOCKWISE = [0, 1, 3, 2];
const GLITCH_EVERY_MS = [350, 1100] as const;

type Rgb = [number, number, number];

interface Patch {
  until: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Unit-ellipse points that give the patch its uneven, rounded outline. */
  shape: [number, number][];
}

function readColor(name: string, fallback: Rgb): Rgb {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(raw);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(raw);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : fallback;
}

/** A scan band that sweeps the hero from one corner to the opposite one (a different corner
 * each pass, going round like a clock). The grid outside it stays flat and still; inside it the
 * grid opens into three layers at different depths that slide against each other with the
 * cursor and with the band, with flickering cells. Now and then a patch of the band tears,
 * glitching, in a random spot. The cursor only affects the layers while it is inside the band. */
export function HeroScan() {
  const { motion } = useMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { style } = useStyle();
  // The scan band belongs to the original style.
  const on = motion === "full" && style === "cyber";

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const host = canvas?.parentElement;
    if (!on || !canvas || !ctx || !host || prefersReducedMotion()) return;

    const off = document.createElement("canvas");
    const octx = off.getContext("2d");
    if (!octx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0;
    let H = 0;
    const resize = () => {
      W = host.clientWidth;
      H = host.clientHeight;
      canvas.width = off.width = Math.round(W * dpr);
      canvas.height = off.height = Math.round(H * dpr);
    };
    resize();
    const resizer = new ResizeObserver(resize);
    resizer.observe(host);

    let visible = true;
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    watcher.observe(host);

    // The cursor, relative to the hero; far away until it has moved.
    let mx = -1e5;
    let my = -1e5;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = host.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let violet = readColor("--grid-line", [196, 170, 255]);
    let accent = readColor("--color-accent", [177, 133, 255]);
    let accent2 = readColor("--color-accent-2", [216, 180, 254]);
    const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    const bandCells = new Map<string, { step: number; on: boolean; c: Rgb }>();
    const patches: Patch[] = [];
    let passIdx = Math.floor(Math.random() * 4);
    let corner = CLOCKWISE[passIdx];
    let travel = 0;
    let hover = 0;
    let smx = -1e5;
    let smy = -1e5;
    let nextGlitch = performance.now() + 500;
    let last = performance.now();
    let frames = 0;

    const frame = (now: number) => {
      if (!visible || !W || !H) {
        setScanBand(null);
        last = now;
        return;
      }
      const dt = Math.min(64, now - last);
      last = now;
      // The theme can change at any time; look the colours up again now and then.
      if (++frames % 90 === 0) {
        violet = readColor("--grid-line", violet);
        accent = readColor("--color-accent", accent);
        accent2 = readColor("--color-accent-2", accent2);
      }

      const span = W + H + 2 * BAND;
      travel += BAND_SPEED * dt;
      if (travel > span) {
        passIdx = (passIdx + 1) % 4;
        corner = CLOCKWISE[passIdx];
        travel = 0;
      }
      const pos = travel - BAND;
      const cx0 = corner & 1 ? W : 0;
      const cy0 = corner & 2 ? H : 0;
      const sx = cx0 ? -1 : 1;
      const sy = cy0 ? -1 : 1;
      const far = cy0 + sy * H;
      const c0 = pos - BAND;
      const c1 = pos + BAND;
      /** Distance from the entry corner, measured along the diagonal the band moves across. */
      const U = (x: number, y: number) => Math.abs(x - cx0) + Math.abs(y - cy0);
      // The fireflies and butterflies react while they are inside the band.
      const box = host.getBoundingClientRect();
      setScanBand({ left: box.left, top: box.top, w: W, h: H, cx0, cy0, pos, half: BAND, color: accent2 });
      const bandPath = (g: CanvasRenderingContext2D) => {
        g.moveTo(cx0 + sx * c0, cy0);
        g.lineTo(cx0 + sx * c1, cy0);
        g.lineTo(cx0 + sx * (c1 - H), far);
        g.lineTo(cx0 + sx * (c0 - H), far);
        g.closePath();
      };

      // The picture is drawn on its own canvas first, so it can be cut to the band.
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.clearRect(0, 0, W, H);

      // The cursor only moves the layers while it is inside the band; leaving it eases the effect out.
      // The cursor is followed with a short lag and the band edge fades the effect over a stretch,
      // so the layers glide instead of jumping when the pointer moves or the band reaches it.
      if (mx > -1e4) {
        if (smx < -1e4) {
          smx = mx;
          smy = my;
        } else {
          const k = 1 - Math.exp(-dt / 120);
          smx += (mx - smx) * k;
          smy += (my - smy) * k;
        }
      }
      const edge = Math.min(1, Math.max(0, (BAND - Math.abs(U(smx, smy) - pos)) / (BAND * 0.6)));
      const want = edge * edge * (3 - 2 * edge);
      hover += (want - hover) * (1 - Math.exp(-dt / 260));
      const nx = (smx / W - 0.5) * hover;
      const ny = (smy / H - 0.5) * hover;
      const sweep = pos / span;
      const layers: [number, Rgb, number, number, number][] = [
        [0.7, accent, 0.18, 50, 1],
        [1, violet, 0.3, 110, 1.2],
        [1.5, accent2, 0.26, 200, 1.6],
      ];
      for (const [scale, c, a, par, lw] of layers) {
        const size = CELL * scale;
        const ox = -nx * par + sweep * par * 3;
        const oy = -ny * par + sweep * par * 3;
        octx.strokeStyle = rgba(c, a);
        octx.lineWidth = lw;
        octx.beginPath();
        for (let x = ((ox % size) + size) % size; x <= W; x += size) {
          octx.moveTo(x, 0);
          octx.lineTo(x, H);
        }
        for (let y = ((oy % size) + size) % size; y <= H; y += size) {
          octx.moveTo(0, y);
          octx.lineTo(W, y);
        }
        octx.stroke();
      }

      // Cells that flicker on and off inside the band.
      const step = Math.floor(now / 140);
      for (let cx = 0; cx < W / CELL; cx++) {
        for (let cy = 0; cy < H / CELL; cy++) {
          const d = U(cx * CELL + CELL / 2, cy * CELL + CELL / 2) - pos;
          const w = Math.abs(d) < BAND ? 1 - Math.abs(d) / BAND : 0;
          if (w <= 0) continue;
          const key = `${cx},${cy}`;
          let st = bandCells.get(key);
          if (!st || st.step !== step) {
            st = { step, on: Math.random() < 0.1 * w, c: Math.random() < 0.5 ? accent : accent2 };
            bandCells.set(key, st);
          }
          if (st.on) {
            octx.fillStyle = rgba(st.c, 0.16 * w);
            octx.fillRect(cx * CELL + 2, cy * CELL + 2, CELL - 3, CELL - 3);
          }
        }
      }
      if (bandCells.size > 4000) bandCells.clear();

      // Cut the picture to the band, sharply, with no border.
      octx.globalCompositeOperation = "destination-in";
      octx.fillStyle = "#000";
      octx.beginPath();
      bandPath(octx);
      octx.fill();
      octx.globalCompositeOperation = "source-over";

      // Short glitches pop up at random spots inside the band, a few at a time.
      if (now > nextGlitch) {
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          for (let tries = 0; tries < 8; tries++) {
            const vy = rand(0, H);
            const x = cx0 + sx * (pos + rand(-BAND, BAND) - vy);
            const y = cy0 + sy * vy;
            if (x < -40 || x > W + 40) continue;
            const n = 7 + Math.floor(Math.random() * 4);
            const shape = Array.from({ length: n }, (_, k): [number, number] => {
              const a = (k / n) * Math.PI * 2 + rand(-0.25, 0.25);
              const r = rand(0.65, 1.1);
              return [Math.cos(a) * r, Math.sin(a) * r];
            });
            patches.push({ until: now + rand(140, 360), x, y, w: rand(160, 420), h: rand(60, 200), shape });
            break;
          }
        }
        nextGlitch = now + rand(GLITCH_EVERY_MS[0], GLITCH_EVERY_MS[1]);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(off, 0, 0, W, H);

      // Each patch tears the picture in its own smooth, uneven outline: rows shifted sideways,
      // ghost copies and flicker. Clearing the patch first shows the still grid under the canvas.
      for (let i = patches.length - 1; i >= 0; i--) {
        const p = patches[i];
        if (now > p.until) {
          patches.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.beginPath();
        bandPath(ctx);
        ctx.clip();
        const pt = (k: number): [number, number] => {
          const [ux, uy] = p.shape[k % p.shape.length];
          return [p.x + (ux * p.w) / 2, p.y + (uy * p.h) / 2];
        };
        const mid = (k: number): [number, number] => {
          const a = pt(k);
          const b = pt(k + 1);
          return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        };
        ctx.beginPath();
        ctx.moveTo(...mid(p.shape.length - 1));
        for (let k = 0; k < p.shape.length; k++) ctx.quadraticCurveTo(...pt(k), ...mid(k));
        ctx.closePath();
        ctx.clip();
        ctx.clearRect(p.x - p.w / 2 - 4, p.y - p.h / 2 - 4, p.w + 8, p.h + 8);
        ctx.globalAlpha = Math.random() < 0.2 ? 0.4 : 1;
        const ROW = 12;
        const top = Math.max(0, Math.floor((p.y - p.h / 2) / ROW) * ROW);
        const bottom = Math.min(H, p.y + p.h / 2);
        for (let y0 = top; y0 < bottom; y0 += ROW) {
          const dx = Math.random() < 0.6 ? rand(-30, 30) : 0;
          ctx.drawImage(off, 0, y0 * dpr, off.width, ROW * dpr, dx, y0, W, ROW);
        }
        ctx.globalAlpha = 0.4;
        ctx.drawImage(off, 6, 0, W, H);
        ctx.drawImage(off, -6, 0, W, H);
        ctx.restore();
      }
    };

    const stop = subscribeTick(frame, 33, true);
    return () => {
      stop();
      setScanBand(null);
      resizer.disconnect();
      watcher.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [on]);

  if (!on) return null;
  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}

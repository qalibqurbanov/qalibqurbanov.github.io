/** Where the hero's scan band is right now, so the fireflies and butterflies can react to it:
 * the hero (HeroScan) publishes the band every frame, the flyers ask whether they are inside it.
 * Everything is in viewport pixels, like the flyers' own positions. */

import { rand } from "@/lib/math";

type Rgb = [number, number, number];

interface Band {
  /** The hero's top-left corner in the viewport. */
  left: number;
  top: number;
  w: number;
  h: number;
  /** The corner the band entered from (hero-local), the distance its middle has travelled from it, and its half width. */
  cx0: number;
  cy0: number;
  pos: number;
  half: number;
  /** The scan colour (the site's second accent), for the marks drawn on scanned flyers. */
  color: Rgb;
}

let band: Band | null = null;

export function setScanBand(next: Band | null): void {
  band = next;
}

/** 0 when the point is outside the band; up to 1 at the band's middle. */
export function scanDepthAt(x: number, y: number): number {
  if (!band) return 0;
  const lx = x - band.left;
  const ly = y - band.top;
  if (lx < 0 || ly < 0 || lx > band.w || ly > band.h) return 0;
  const d = Math.abs(lx - band.cx0) + Math.abs(ly - band.cy0) - band.pos;
  return Math.max(0, 1 - Math.abs(d) / band.half);
}

// Inside the band every flyer glitches. Now and then there is a scan window, a few seconds long,
// and a random minority of the flyers are also scanned (marked) while it lasts and they are inside.
const WINDOW_MS = [2500, 3500] as const;
const GAP_MS = [20000, 40000] as const;
/** Share of the flyers that a window picks, drawn anew each window: a small minority. */
const SHARE = [0.08, 0.2] as const;
let windowId = 0;
let windowEnd = 0;
let nextWindow = 0;
let share = 0.3;

function advanceWindow(now: number): void {
  if (nextWindow === 0) nextWindow = now + 4000;
  if (now < nextWindow) return;
  windowId += 1;
  windowEnd = now + rand(WINDOW_MS[0], WINDOW_MS[1]);
  nextWindow = windowEnd + rand(GAP_MS[0], GAP_MS[1]);
  share = rand(SHARE[0], SHARE[1]);
}

/** A steady pseudo-random number between 0 and 1 for this flyer in this window. */
function pick(seed: number, window: number): number {
  const v = Math.sin(seed * 12.9898 + window * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** One flyer's relationship with the band: how far inside it is (eased), whether it is being
 * scanned, a flash for the moment that starts, and its made-up ID for the tag. */
export class ScanTrack {
  /** 0 outside, easing to 1 while inside: drives the glitch. */
  k = 0;
  /** 0 → 1 while it is being scanned: drives the marks. */
  m = 0;
  /** 1 the moment a scan of it starts, fading to 0. */
  flash = 0;
  enteredAt = 0;
  readonly id: string;
  private seed: number;
  private scanning = false;

  constructor(seed: number) {
    this.seed = seed;
    this.id = `ID 0x${((seed * 2749 + 4096) & 0xfff).toString(16).toUpperCase().padStart(3, "0")}`;
  }

  update(x: number, y: number, now: number, dt: number): void {
    const depth = scanDepthAt(x, y);
    const inside = depth > 0;
    // The glitch reaches full strength just inside the band and eases off the same way, quickly but without
    // a hard switch at its edge.
    this.k += (Math.min(1, depth * 7) - this.k) * Math.min(1, dt * 14);
    if (this.k < 0.01) this.k = 0;
    advanceWindow(now);
    const scanning = inside && now < windowEnd && pick(this.seed, windowId) < share;
    if (scanning && !this.scanning) {
      this.flash = 1;
      this.enteredAt = now;
    }
    this.scanning = scanning;
    this.m += ((scanning ? 1 : 0) - this.m) * Math.min(1, dt * 9);
    this.flash = Math.max(0, this.flash - dt * 1.5);
  }

  /** How strongly it glitches: 0 outside the band, building to 1 deeper in. Everything the glitch
   * does is scaled by this, so it starts and ends smoothly. */
  get glitch(): number {
    return this.k;
  }

  /** Whether there is anything of a scan to draw. */
  get marked(): boolean {
    return this.m > 0.05 || this.flash > 0;
  }
}

/** A ring when the band reaches the flyer, then corner brackets that close in on it with a small tag
 * while it stays inside. `r` is the bracket radius it settles at. */
export function drawScanMark(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, track: ScanTrack, now: number, kind: string): void {
  if (!track.marked) return;
  const [cr, cg, cb] = band?.color ?? [216, 180, 254];
  const col = (a: number) => `rgba(${cr},${cg},${cb},${a})`;
  ctx.save();
  ctx.globalAlpha = 1;
  if (track.flash > 0) {
    ctx.strokeStyle = col(track.flash * 0.9);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 6 + (1 - track.flash) * 46, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (track.m > 0.05) {
    const grow = Math.min(1, (now - track.enteredAt) / 260);
    const p = grow * track.m;
    const R = r * (1 + (1 - p) * 0.8);
    const a = Math.min(1, p * 1.5);
    const l = R * 0.45;
    ctx.strokeStyle = col(a);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.moveTo(x + sx * R, y + sy * (R - l));
      ctx.lineTo(x + sx * R, y + sy * R);
      ctx.lineTo(x + sx * (R - l), y + sy * R);
    }
    ctx.stroke();
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = col(a * 0.9);
    ctx.fillText(`${track.id} · ${kind}`, x + R + 6, y - R + 8);
  }
  ctx.restore();
}

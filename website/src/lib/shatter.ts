
import { glitchScreen } from "@/hooks/glitch";
import { glitchStorm } from "@/lib/effects";
import { isLightTheme } from "@/lib/themeMode";
import { clamp, easeOutCubic } from "@/lib/math";

/** The shard-based demolition behind the cyber butterfly (see demolition.ts).
 *
 * Instead of moving DOM elements, the rendered foreground of the whole page is
 * captured once into a bitmap (text, images, SVGs, pseudo-elements, borders,
 * shadows: whatever the browser painted). The page's own background layers are
 * left out of that capture and stay live in the DOM, so they remain visible
 * behind everything. The bitmap is cut into irregular Voronoi shards whose size
 * follows the content (small around text, large over solid panels), and every
 * shard is broken off in strict top-to-bottom order: cracks, tremor, detach,
 * fall, bounce, settle. Landed shards are baked into one pile at the real
 * bottom edge of the page, so the ruins are made of the page's own pixels.
 *
 * Everything is procedural: a fresh seed per run (or `?demolitionSeed=`). */

interface Origin {
  x: number;
  y: number;
}

interface Options {
  hint: string;
  hintAny: string;
}

type Rng = () => number;

interface Shard {
  /** Polygon in page px, flat [x0, y0, x1, y1, ...]. */
  px: number[];
  bx: number;
  by: number;
  bw: number;
  bh: number;
  /** Centre of the bounding box: where the shard rests before it breaks. */
  cx: number;
  cy: number;
  /** Effective area (px²): how much rubble it will make. */
  eff: number;
  /** Polygon area (px²). */
  area: number;
  band: number;
  crackStart: number;
  trigger: number;
  /** 0 intact, 1 cracking, 2 falling, 3 landed, 4 empty, 5 hanging. */
  phase: 0 | 1 | 2 | 3 | 4 | 5;
  cv: HTMLCanvasElement | null;
  x: number;
  y: number;
  a: number;
  vx: number;
  vy: number;
  om: number;
  sc: number;
  k: number;
  age: number;
  bounces: number;
  slides: number;
  /** Stays hanging from a cracked edge, and drops later. */
  hang: boolean;
  /** One of the few big slabs that shape the pile. */
  slab: boolean;
  seek: number;
  hx: number;
  hy: number;
  ha: number;
  dropAt: number;
  ph: number;
  e: number;
  drag: number;
  wob: number;
  cracks: number[][];
}

interface Band {
  fx: number;
  style: 0 | 1 | 2;
  dir: number;
  spread: number;
}

interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  grow: number;
  life: number;
  max: number;
  alpha: number;
  warm: boolean;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  grav: number;
}

interface Ring {
  x: number;
  y: number;
  r: number;
  speed: number;
  life: number;
  max: number;
  width: number;
  color: string;
}

interface Emitter {
  x: number;
  y: number;
  ph: number;
  next: number;
  color: string;
}

const TAU = Math.PI * 2;

const T_ACTIVATE = 650;
const T_FRACTURE = 1100;
const SWEEP_PX_PER_S = 620;
const CAM_LEAD = 0.4;
const T_REBOOT = 1100;
const BIN = 4;
const GRID = 8;
/** How much wider than tall the fragments are: masonry slabs, not bubbles. */
const SLAB = 1.8;

let fontCss: string | null = null;

function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Part of the page's background treatment: it is neither captured nor hidden. */
function isBackdrop(el: Element): boolean {
  if (el.hasAttribute("data-demolish-keep")) return true;
  // Window effects (the hero terminal's HUD) are drawn around a block and break with it.
  if (el.closest("[data-demolish-part]")) return false;
  const cs = getComputedStyle(el);
  if (cs.position === "fixed" && cs.pointerEvents === "none") return true;
  if (el.getAttribute("aria-hidden") !== "true" || cs.pointerEvents !== "none") return false;
  if (el.matches("svg, img, video, canvas") || el.closest("svg") || el.textContent?.trim() || el.querySelector("img, svg, video, canvas")) return false;
  // Only page-sized decoration (glow layers, grids) stays behind; a small glow
  // around a window or an icon belongs to that element and breaks with it.
  const r = el.getBoundingClientRect();
  return r.width >= window.innerWidth * 0.6 && r.height >= window.innerHeight * 0.5;
}

/** Fixed widgets that are not at the top (back-to-top...) would be painted at the wrong place. */
function isStrayFixed(el: Element): boolean {
  const cs = getComputedStyle(el);
  return cs.position === "fixed" && el.getBoundingClientRect().top > window.innerHeight * 0.3;
}

async function capturePage(root: HTMLElement, W: number, Hd: number, ratio: number): Promise<HTMLCanvasElement> {
  // Scroll-reveal blocks further down have not faded in yet: show them for the shot.
  const style = document.createElement("style");
  style.textContent =
    '#root [class*="opacity-0"][class*="translate-y-"]{opacity:1!important;translate:none!important;transform:none!important;transition:none!important}';
  document.head.appendChild(style);
  // Fixed widgets (back-to-top) are pinned where they are on the page so they break with it.
  const pinned: Array<[HTMLElement, string | null]> = [];
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("[data-demolish-fixed]"))) {
    if (Number.parseFloat(getComputedStyle(el).opacity) < 0.5) continue;
    const r = el.getBoundingClientRect();
    pinned.push([el, el.getAttribute("style")]);
    el.style.cssText += `;position:absolute;top:${r.top + window.scrollY}px;left:${r.left}px;right:auto;bottom:auto;transform:none;transition:none`;
  }
  try {
    const { getFontEmbedCSS, toCanvas } = await import("html-to-image");
    if (fontCss === null) fontCss = await getFontEmbedCSS(root).catch(() => "");
    const shot = toCanvas(root, {
      width: W,
      height: Hd,
      pixelRatio: ratio,
      fontEmbedCSS: fontCss,
      filter: (node: HTMLElement) => node.nodeType !== 1 || (!isBackdrop(node) && !isStrayFixed(node)),
    });
    const timeout = new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("page capture timed out")), 9000));
    return await Promise.race([shot, timeout]);
  } finally {
    for (const [el, old] of pinned) {
      if (old === null) el.removeAttribute("style");
      else el.setAttribute("style", old);
    }
    style.remove();
  }
}

/** Averages a canvas down by 2x until it is `GRID` times smaller. */
function coverageOf(src: HTMLCanvasElement, ratio: number, W: number, Hd: number): { cov: Float32Array; gw: number; gh: number } {
  let cur = src;
  let scale = ratio;
  while (scale > 1 / GRID * 1.01) {
    const next = document.createElement("canvas");
    next.width = Math.max(1, Math.ceil(cur.width / 2));
    next.height = Math.max(1, Math.ceil(cur.height / 2));
    const g = next.getContext("2d");
    if (!g) throw new Error("2d canvas unavailable");
    g.imageSmoothingQuality = "high";
    g.drawImage(cur, 0, 0, next.width, next.height);
    cur = next;
    scale /= 2;
  }
  const gw = Math.ceil(W / GRID);
  const gh = Math.ceil(Hd / GRID);
  const fin = document.createElement("canvas");
  fin.width = gw;
  fin.height = gh;
  const g = fin.getContext("2d", { willReadFrequently: true });
  if (!g) throw new Error("2d canvas unavailable");
  g.imageSmoothingQuality = "high";
  g.drawImage(cur, 0, 0, gw, gh);
  const data = g.getImageData(0, 0, gw, gh).data;
  const cov = new Float32Array(gw * gh);
  for (let i = 0; i < cov.length; i++) cov[i] = data[i * 4 + 3] / 255;
  return { cov, gw, gh };
}

export function shatter(origin: Origin, options: Options): Promise<void> {
  return new Shatter(origin, options).run();
}

class Shatter {
  private readonly W = document.documentElement.clientWidth;
  private readonly H = window.innerHeight;
  private readonly mobile = this.W < 700;
  /** The light theme: the dark chunks, vignette and heap are drawn in light tones instead. */
  private readonly light = isLightTheme();
  private readonly scroll0 = window.scrollY;
  private readonly Hd = Math.max(document.documentElement.scrollHeight, window.innerHeight);
  private readonly ratio = this.mobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.25);
  private readonly g = 2300 * Math.max(0.7, Math.min(1.3, window.innerHeight / 900));
  private readonly capH = this.H * 0.5;
  private readonly root = document.getElementById("root");
  private readonly rng: Rng;
  private readonly seed: number;
  private readonly origin: Origin;
  private readonly options: Options;

  private readonly canvas = document.createElement("canvas");
  private ctx!: CanvasRenderingContext2D;
  private page!: HTMLCanvasElement;
  private pageCtx!: CanvasRenderingContext2D;
  private pile!: HTMLCanvasElement;
  private pileCtx!: CanvasRenderingContext2D;
  private pileH = 0;
  private shards: Shard[] = [];
  private byCrack: Shard[] = [];
  private cracking: Shard[] = [];
  private falling: Shard[] = [];
  private bands: Band[] = [];
  private readonly puffs: Puff[] = [];
  private readonly sparks: Spark[] = [];
  private readonly rings: Ring[] = [];
  private heights!: Float32Array;
  private puffSprite!: HTMLCanvasElement;
  private warmSprite!: HTMLCanvasElement;
  private accent = "#b185ff";
  private accent2 = "#22d3ee";
  private warm = "#fcd34d";
  private maxPuffs = 130;
  private hanging: Shard[] = [];
  private emitters: Emitter[] = [];
  private mounds: number[] = [];
  private decal: HTMLCanvasElement | null = null;
  private decalCtx: CanvasRenderingContext2D | null = null;
  private scorches = 0;
  private afterAt = 0;
  private dim = 0;
  private flick = 1;
  private surgeAt = 0;
  private surgeUntil = 0;
  private rain: Array<{ x: number; y: number; v: number; acc: number; g: number[] }> = [];
  private glyphs: HTMLCanvasElement | null = null;
  private rainCell: [number, number] = [14, 16];

  private hint: HTMLElement | null = null;
  private clock = 0;
  private last = 0;
  private raf = 0;
  private sy = window.scrollY;
  private front = 0;
  private ci = 0;
  private landedCount = 0;
  private liveCount = 0;
  private demoAt = T_ACTIVATE + T_FRACTURE;
  private tMax = 0;
  private impulse = 0;
  private shakeX = 0;
  private shakeY = 0;
  private stage: "run" | "after" | "reboot" = "run";
  private rebootAt = 0;
  private camReboot = 0;
  private activated = false;
  private pulsed = false;
  private resolve: () => void = () => {};
  private cleanup: Array<() => void> = [];
  private hidden: Array<() => void> = [];

  constructor(origin: Origin, options: Options) {
    const param = new URLSearchParams(window.location.search).get("demolitionSeed");
    const parsed = param !== null ? Number.parseInt(param, 10) : Number.NaN;
    this.seed = Number.isFinite(parsed) ? parsed >>> 0 : (Math.floor(Math.random() * 4294967296) ^ Math.floor(performance.now() * 1000)) >>> 0;
    this.rng = mulberry32(this.seed);
    this.origin = { x: origin.x, y: origin.y + this.scroll0 };
    this.options = options;
  }

  private rand(min: number, max: number): number {
    return min + this.rng() * (max - min);
  }

  async run(): Promise<void> {
    if (!this.root) throw new Error("no root");
    const root = this.root;
    const shot = await capturePage(root, this.W, this.Hd, this.ratio);
    if (!shot.width || !shot.height) throw new Error("empty page capture");
    this.page = shot;
    const pc = shot.getContext("2d");
    if (!pc) throw new Error("2d canvas unavailable");
    this.pageCtx = pc;
    this.setupCanvas();
    this.fragment();
    if (this.shards.length < 8) throw new Error("nothing to shatter");

    // Swap: the live foreground goes invisible (background layers stay), the
    // canvas draws the same pixels, and the glitch hides the seam.
    document.documentElement.classList.add("demolishing");
    root.inert = true;
    this.hideForeground(root);
    document.body.appendChild(this.canvas);
    this.plan();

    const onResize = () => {
      if (Math.abs(document.documentElement.clientWidth - this.W) > 2) this.beginReboot();
    };
    window.addEventListener("resize", onResize);
    this.cleanup.push(() => window.removeEventListener("resize", onResize));

    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  private setupCanvas(): void {
    const r = this.ratio;
    this.canvas.className = "demolition-canvas";
    this.canvas.width = Math.round(this.W * r);
    this.canvas.height = Math.round(this.H * r);
    this.canvas.style.width = `${this.W}px`;
    this.canvas.style.height = `${this.H}px`;
    this.canvas.setAttribute("aria-hidden", "true");
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("2d canvas unavailable");
    this.ctx = ctx;
    ctx.scale(r, r);

    this.pileH = Math.min(this.Hd, Math.round(this.H * 1.15));
    this.pile = document.createElement("canvas");
    this.pile.width = Math.round(this.W * r);
    this.pile.height = Math.round(this.pileH * r);
    const pg = this.pile.getContext("2d");
    if (!pg) throw new Error("2d canvas unavailable");
    this.pileCtx = pg;

    if (this.W * this.Hd < 36e6) {
      this.decal = document.createElement("canvas");
      this.decal.width = this.W;
      this.decal.height = this.Hd;
      this.decalCtx = this.decal.getContext("2d");
    }

    const css = getComputedStyle(document.documentElement);
    this.accent = css.getPropertyValue("--color-accent").trim() || this.accent;
    this.accent2 = css.getPropertyValue("--color-accent-2").trim() || this.accent2;
    this.warm = css.getPropertyValue("--color-syn-type").trim() || this.warm;
    this.maxPuffs = this.mobile ? 60 : 130;
    this.heights = new Float32Array(Math.ceil(this.W / BIN) + 2);
    this.puffSprite = this.sprite("rgba(150,140,175,1)", "rgba(60,52,90,0)");
    this.warmSprite = this.sprite("rgba(255,220,150,1)", "rgba(255,120,60,0)");
  }

  /** The foreground goes invisible; background layers inside it are kept visible. */
  private hideForeground(root: HTMLElement): void {
    const keep: HTMLElement[] = [];
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
      if (el.parentElement && keep.some((k) => k.contains(el))) continue;
      if (isBackdrop(el)) keep.push(el);
    }
    const prev = root.style.visibility;
    root.style.visibility = "hidden";
    this.hidden.push(() => {
      root.style.visibility = prev;
    });
    // Blocks that set `visibility: visible` themselves (the hero terminal's panes)
    // ignore the hidden root, so they are hidden one by one.
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
      if (keep.some((k) => k.contains(el)) || getComputedStyle(el).visibility !== "visible") continue;
      const old = el.style.visibility;
      el.style.visibility = "hidden";
      this.hidden.push(() => {
        el.style.visibility = old;
      });
    }
    for (const el of keep) {
      const old = el.style.visibility;
      el.style.visibility = "visible";
      this.hidden.push(() => {
        el.style.visibility = old;
      });
    }
  }

  // --- Fragmentation ---

  private fragment(): void {
    const { W, Hd, ratio } = this;
    const { cov, gw, gh } = coverageOf(this.page, ratio, W, Hd);
    const covAt = (x: number, y: number) => cov[clamp(Math.floor(y / GRID), 0, gh - 1) * gw + clamp(Math.floor(x / GRID), 0, gw - 1)];
    const localCov = (x: number, y: number) => {
      let m = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) m = Math.max(m, covAt(x + dx * GRID, y + dy * GRID));
      return m;
    };
    const cap = this.mobile ? 1300 : 2600;

    // Fresh grain every run: how coarse the whole fracture is.
    let grain = this.rand(0.85, 1.25) * (this.mobile ? 1.2 : 1);
    let shards: Shard[] = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      shards = this.cut(grain, localCov, gw, gh, cov);
      if (shards.length <= cap) break;
      grain *= Math.sqrt(shards.length / cap) * 1.05;
    }
    shards.push(...this.leftovers(shards, cov, gw, gh));
    this.shards = shards;

    // The pile has to fit the whole page: pieces shrink as they crumble.
    let area = 0;
    for (const s of shards) area += s.area;
    const target = W * this.capH * 0.55;
    const base = clamp(Math.sqrt(target / Math.max(1, area)), 0.15, 0.92);
    for (const s of shards) s.k = clamp(base * this.rand(0.85, 1.2) * (s.eff < 500 ? 1.15 : 1), 0.3, 0.95);
    // A handful of the biggest pieces stay big: slabs that lean and shape the heap.
    const big = shards.filter((s) => s.eff > 3500).sort((a, b) => b.eff - a.eff).slice(0, 14);
    for (let i = big.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [big[i], big[j]] = [big[j], big[i]];
    }
    for (const s of big.slice(0, this.mobile ? 4 : 7)) {
      s.slab = true;
      s.k = this.rand(0.5, 0.78);
    }
  }

  /** Painted pixels that no shard covers would stay up in the air once the rest
   * has fallen: they become small blocks of their own and come down with it. */
  private leftovers(shards: Shard[], cov: Float32Array, gw: number, gh: number): Shard[] {
    const taken = new Uint8Array(gw * gh);
    for (const s of shards) {
      for (let cy = Math.max(0, Math.floor(s.by / GRID)); cy <= Math.min(gh - 1, Math.floor((s.by + s.bh) / GRID)); cy++) {
        for (let cx = Math.max(0, Math.floor(s.bx / GRID)); cx <= Math.min(gw - 1, Math.floor((s.bx + s.bw) / GRID)); cx++) {
          if (!taken[cy * gw + cx] && pointIn(s.px, (cx + 0.5) * GRID, (cy + 0.5) * GRID)) taken[cy * gw + cx] = 1;
        }
      }
    }
    const B = 6;
    const out: Shard[] = [];
    for (let by = 0; by < gh; by += B) {
      for (let bx = 0; bx < gw; bx += B) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let opaque = 0;
        for (let cy = by; cy < Math.min(gh, by + B); cy++) {
          for (let cx = bx; cx < Math.min(gw, bx + B); cx++) {
            const c = cov[cy * gw + cx];
            if (taken[cy * gw + cx] || c < 0.02) continue;
            opaque += c * GRID * GRID;
            minX = Math.min(minX, cx * GRID);
            minY = Math.min(minY, cy * GRID);
            maxX = Math.max(maxX, (cx + 1) * GRID);
            maxY = Math.max(maxY, (cy + 1) * GRID);
          }
        }
        if (opaque < 12) continue;
        const x0 = Math.max(0, minX - 2);
        const y0 = Math.max(0, minY - 2);
        const x1 = Math.min(this.W, maxX + 2);
        const y1 = Math.min(this.Hd, maxY + 2);
        const bw = x1 - x0;
        const bh = y1 - y0;
        if (bw < 4 || bh < 4) continue;
        out.push({
          px: [x0, y0, x1, y0, x1, y1, x0, y1],
          bx: x0,
          by: y0,
          bw,
          bh,
          cx: x0 + bw / 2,
          cy: y0 + bh / 2,
          eff: opaque,
          area: bw * bh,
          band: 0,
          crackStart: 0,
          trigger: 0,
          phase: 0,
          cv: null,
          x: x0 + bw / 2,
          y: y0 + bh / 2,
          a: 0,
          vx: 0,
          vy: 0,
          om: 0,
          sc: 1,
          k: 0.5,
          age: 0,
          bounces: 0,
          slides: 0,
          hang: false,
          slab: false,
          seek: 0,
          hx: 0,
          hy: 0,
          ha: 0,
          dropAt: Infinity,
          ph: 0,
          e: 0.25,
          drag: 0.1,
          wob: 0,
          cracks: [],
        });
      }
    }
    return out;
  }

  private cut(grain: number, localCov: (x: number, y: number) => number, gw: number, gh: number, cov: Float32Array): Shard[] {
    const { W, Hd } = this;
    const cell = 26;
    type Seed = { x: number; y: number; r: number };
    const cands: Seed[] = [];
    for (let y = 0; y < Hd; y += cell) {
      for (let x = 0; x < W; x += cell) {
        const px = x + this.rand(0, cell);
        const py = y + this.rand(0, cell);
        const c = localCov(px, py);
        if (c < 0.004) continue;
        const r = (c > 0.5 ? this.rand(76, 110) : c > 0.12 ? this.rand(46, 72) : this.rand(28, 44)) * grain;
        cands.push({ x: px, y: py, r });
      }
    }
    for (let i = cands.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [cands[i], cands[j]] = [cands[j], cands[i]];
    }
    const HC = 48;
    const hw = Math.ceil(W / HC) + 1;
    const hash = new Map<number, Seed[]>();
    const keyOf = (gx: number, gy: number) => gy * hw + gx;
    const seeds: Seed[] = [];
    let maxR = 0;
    for (const c of cands) {
      const reach = Math.ceil((c.r + maxR) / HC);
      const gx = Math.floor(c.x / HC);
      const gy = Math.floor(c.y / HC);
      let ok = true;
      for (let dy = -reach; dy <= reach && ok; dy++) {
        for (let dx = -reach; dx <= reach && ok; dx++) {
          const list = hash.get(keyOf(gx + dx, gy + dy));
          if (!list) continue;
          for (const s of list) {
            if (Math.hypot((s.x - c.x) / SLAB, s.y - c.y) < (s.r + c.r) * 0.5) {
              ok = false;
              break;
            }
          }
        }
      }
      if (!ok) continue;
      seeds.push(c);
      maxR = Math.max(maxR, c.r);
      const k = keyOf(gx, gy);
      const list = hash.get(k);
      if (list) list.push(c);
      else hash.set(k, [c]);
    }

    const noiseA = this.rand(0, 100);
    const noiseB = this.rand(0, 100);
    const nz = (x: number, y: number) => Math.sin(x * 0.11 + noiseA) * Math.cos(y * 0.13 + noiseB);
    const out: Shard[] = [];
    const RMAX = 210;
    const reachCells = Math.ceil((RMAX * 2) / HC);
    for (const s of seeds) {
      // Start from a rough disc and cut it with the bisector of every neighbour.
      const rot = this.rand(0, TAU);
      let poly: number[] = [];
      for (let i = 0; i < 12; i++) poly.push(s.x + Math.cos(rot + (i / 12) * TAU) * RMAX, s.y + Math.sin(rot + (i / 12) * TAU) * RMAX);
      const gx = Math.floor(s.x / HC);
      const gy = Math.floor(s.y / HC);
      const near: Seed[] = [];
      for (let dy = -reachCells; dy <= reachCells; dy++) {
        for (let dx = -reachCells; dx <= reachCells; dx++) {
          const list = hash.get(keyOf(gx + dx, gy + dy));
          if (list) for (const o of list) if (o !== s) near.push(o);
        }
      }
      near.sort((m, n) => (m.x - s.x) ** 2 + (m.y - s.y) ** 2 - ((n.x - s.x) ** 2 + (n.y - s.y) ** 2));
      for (const o of near) {
        const dx = o.x - s.x;
        const dy = o.y - s.y;
        const d = Math.hypot(dx, dy);
        let far = 0;
        for (let i = 0; i < poly.length; i += 2) far = Math.max(far, Math.hypot(poly[i] - s.x, poly[i + 1] - s.y));
        if (d / (2 * SLAB * SLAB) > far) break;
        // Distances are measured with x compressed, so the cells come out wide
        // and flat: slabs of wall and floor rather than round bubbles.
        poly = clipHalf(poly, (s.x + o.x) / 2, (s.y + o.y) / 2, dx / (SLAB * SLAB), dy);
        if (poly.length < 6) break;
      }
      if (poly.length < 6) continue;
      // Roughen the straight bisectors: a displaced midpoint on every long edge,
      // the same for both neighbours of the edge, so the pieces still fit.
      const rough: number[] = [];
      const n = poly.length / 2;
      for (let i = 0; i < n; i++) {
        const ax = clamp(poly[i * 2], 0, W);
        const ay = clamp(poly[i * 2 + 1], 0, Hd);
        const bx = clamp(poly[((i + 1) % n) * 2], 0, W);
        const by = clamp(poly[((i + 1) % n) * 2 + 1], 0, Hd);
        rough.push(ax, ay);
        const len = Math.hypot(bx - ax, by - ay);
        if (len > 16) {
          const flip = ax < bx || (ax === bx && ay < by) ? 1 : -1;
          const nx = (-(by - ay) / len) * flip;
          const ny = ((bx - ax) / len) * flip;
          const mx = (ax + bx) / 2;
          const my = (ay + by) / 2;
          const off = nz(mx, my) * len * 0.05;
          rough.push(mx + nx * off, my + ny * off);
        }
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < rough.length; i += 2) {
        minX = Math.min(minX, rough[i]);
        maxX = Math.max(maxX, rough[i]);
        minY = Math.min(minY, rough[i + 1]);
        maxY = Math.max(maxY, rough[i + 1]);
      }
      const bw = maxX - minX;
      const bh = maxY - minY;
      if (bw < 4 || bh < 4) continue;
      // How much of it is actually painted.
      let opaque = 0;
      for (let cy = Math.floor(minY / GRID); cy <= Math.floor(maxY / GRID); cy++) {
        for (let cx = Math.floor(minX / GRID); cx <= Math.floor(maxX / GRID); cx++) {
          if (cx < 0 || cy < 0 || cx >= gw || cy >= gh) continue;
          if (pointIn(rough, (cx + 0.5) * GRID, (cy + 0.5) * GRID)) opaque += cov[cy * gw + cx] * GRID * GRID;
        }
      }
      if (opaque < 24) continue;
      const area = polyArea(rough);
      const cxm = minX + bw / 2;
      const cym = minY + bh / 2;
      const cracks: number[][] = [];
      if (area > 2200) {
        for (let c = 0, count = area > 7000 ? 3 : area > 4000 ? 2 : 1; c < count; c++) {
          const vi = Math.floor(this.rng() * (rough.length / 2)) * 2;
          let x = rough[vi] - cxm;
          let y = rough[vi + 1] - cym;
          let ang = Math.atan2(-y, -x) + this.rand(-0.5, 0.5);
          const line = [x, y];
          const segs = Math.round(this.rand(4, 8));
          const step = Math.hypot(x, y) / segs;
          for (let i = 0; i < segs; i++) {
            ang += this.rand(-0.8, 0.8);
            x += Math.cos(ang) * step * this.rand(0.6, 1.2);
            y += Math.sin(ang) * step * this.rand(0.6, 1.2);
            line.push(x, y);
          }
          cracks.push(line);
        }
      }
      const m = 0.5 * area + 0.5 * opaque;
      out.push({
        px: rough,
        bx: minX,
        by: minY,
        bw,
        bh,
        cx: cxm,
        cy: cym,
        eff: m,
        area,
        band: 0,
        crackStart: 0,
        trigger: 0,
        phase: 0,
        cv: null,
        x: cxm,
        y: cym,
        a: 0,
        vx: 0,
        vy: 0,
        om: 0,
        sc: 1,
        k: 0.5,
        age: 0,
        bounces: 0,
        slides: 0,
        hang: false,
        slab: false,
        seek: 0,
        hx: 0,
        hy: 0,
        ha: 0,
        dropAt: Infinity,
        ph: 0,
        e: 0.25,
        drag: 0.1,
        wob: 0,
        cracks,
      });
    }
    return out;
  }

  // --- Timeline ---

  private plan(): void {
    const { W, Hd } = this;
    const lead = clamp(this.scroll0 * 0.25, 0, 1000);
    this.demoAt = T_ACTIVATE + T_FRACTURE + lead;
    const sweep = clamp((Hd / SWEEP_PX_PER_S) * 1000, 3200, 16000);
    this.tMax = this.demoAt + sweep + 9000;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const s of this.shards) {
      minY = Math.min(minY, s.cy);
      maxY = Math.max(maxY, s.cy);
    }
    const span = Math.max(1, maxY - minY);
    // Bands of the page fail around their own random point, in their own style.
    const bandH = this.rand(190, 300);
    const nb = Math.ceil(Hd / bandH) + 1;
    for (let i = 0; i < nb; i++) {
      const r = this.rng();
      this.bands.push({ fx: this.rand(0, W), style: r < 0.38 ? 0 : r < 0.74 ? 1 : 2, dir: this.rng() < 0.5 ? -1 : 1, spread: this.rand(160, 460) });
    }
    for (const s of this.shards) {
      s.band = clamp(Math.floor(s.cy / bandH), 0, nb - 1);
      const b = this.bands[s.band];
      const progress = (s.cy - minY) / span;
      let t = this.demoAt + progress * sweep + (Math.abs(s.cx - b.fx) / W) * b.spread + this.rand(0, 180);
      const roll = this.rng();
      if (roll < 0.1) t -= this.rand(150, 380);
      else if (roll > 0.92) t += this.rand(200, 420);
      s.trigger = Math.max(this.demoAt, t);
      s.crackStart = clamp(s.trigger - this.rand(650, 1050), T_ACTIVATE + this.rand(0, 140), s.trigger);
      const m = Math.sqrt(s.eff) / 60;
      s.e = clamp(0.34 - m * 0.08, 0.12, 0.34);
      s.drag = clamp(0.5 / Math.max(0.5, m), 0.05, 0.7);
      s.wob = this.rand(0, TAU);
    }
    // Where the heap piles up highest this time.
    const nm = 2 + Math.floor(this.rng() * 2);
    for (let i = 0; i < nm; i++) this.mounds.push(this.rand(0.12, 0.88) * W);
    // A few pieces near the bottom of the view will not come down with the rest.
    const pool = this.shards.filter((s) => !s.slab && s.eff > 1500 && s.cy > Hd - this.H * 0.95 && s.cy < Hd - this.H * 0.42);
    const wide = pool.length < 4 ? this.shards.filter((s) => !s.slab && s.eff > 1500 && s.cy > Hd - this.H * 1.4 && s.cy < Hd - this.H * 0.3) : pool;
    for (let i = 0; i < (this.mobile ? 3 : 6) && wide.length; i++) {
      const k = Math.floor(this.rng() * wide.length);
      wide[k].hang = true;
      wide.splice(k, 1);
    }
    this.byCrack = this.shards.slice().sort((a, b) => a.crackStart - b.crackStart);
    this.liveCount = this.shards.length;
  }

  // --- Frame loop ---

  private frame = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    // Simulation time: a stuttering frame rate slows the show instead of skipping it.
    this.clock += dt * 1000;
    if (this.stage === "reboot") this.updateReboot(now);
    else this.update(dt, this.clock);
    this.draw();
    if (this.stage === "reboot" && now - this.rebootAt > T_REBOOT + 60) {
      this.finish();
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private update(dt: number, t: number): void {
    if (!this.activated) {
      this.activated = true;
      this.addRing(this.origin.x, this.origin.y, 40, 260, 0.9, 3, this.accent2);
      glitchScreen();
      glitchStorm(1100);
    }
    if (!this.pulsed && t >= T_ACTIVATE) {
      this.pulsed = true;
      this.addRing(this.origin.x, this.origin.y, 20, Math.hypot(this.W, this.H) * 1.2, 1.1, 5, "#ffffff");
      this.addRing(this.origin.x, this.origin.y, 10, Math.hypot(this.W, this.H) * 0.9, 1.3, 3, this.accent);
      this.burstSparks(this.origin.x, this.origin.y, this.mobile ? 30 : 70, 700);
      this.impulse += 7;
      glitchScreen();
    }
    const ramp = t < T_ACTIVATE ? 0 : t < this.demoAt ? ((t - T_ACTIVATE) / T_FRACTURE) * 2 : this.stage === "run" ? 1.2 : 0.2;
    this.impulse *= Math.exp(-5 * dt);
    const amp = Math.min(9, ramp + this.impulse);
    this.shakeX = (Math.random() - 0.5) * 2 * amp;
    this.shakeY = (Math.random() - 0.5) * 2 * amp;

    this.dim = this.stage === "run" ? clamp(this.ci / Math.max(1, this.byCrack.length), 0, 1) * 0.3 : 0.32;
    this.moveCamera(dt, t);

    while (this.ci < this.byCrack.length && this.byCrack[this.ci].crackStart <= t) this.startCrack(this.byCrack[this.ci++]);

    const stillCracking: Shard[] = [];
    for (const s of this.cracking) {
      const p = clamp((t - s.crackStart) / Math.max(1, s.trigger - s.crackStart), 0, 1);
      if (t >= s.trigger) {
        this.detach(s);
        continue;
      }
      // Tremor that grows until it lets go.
      const j = p * p * 2.2;
      s.x = s.cx + (Math.random() - 0.5) * j;
      s.y = s.cy + (Math.random() - 0.5) * j;
      s.a = (Math.random() - 0.5) * 0.03 * p;
      if (s.eff > 900 && Math.random() < dt * 3) this.dust(s.x + this.rand(-s.bw / 2, s.bw / 2), s.y + s.bh / 2, 1, 12, false);
      stillCracking.push(s);
    }
    this.cracking = stillCracking;

    const stillFalling: Shard[] = [];
    // Small sub-steps keep thin pieces from tunnelling through the heap on a slow frame.
    const sub = Math.max(1, Math.ceil(dt / 0.016));
    for (const s of this.falling) {
      for (let i = 0; i < sub && s.phase === 2; i++) this.step(s, dt / sub);
      if (s.phase === 2) stillFalling.push(s);
    }
    this.falling = stillFalling;

    // Survivors sway on their last bit of hold, then let go one by one.
    if (this.hanging.length) {
      const still: Shard[] = [];
      for (const s of this.hanging) {
        if (this.stage === "after" && t >= s.dropAt) this.release(s);
        else {
          if (Math.random() < dt * 0.9) this.burstSparks(s.hx, s.hy, 3, 180);
          still.push(s);
        }
      }
      this.hanging = still;
    }

    this.updateParticles(dt);

    const done = this.landedCount + this.hanging.length >= this.liveCount && this.ci >= this.byCrack.length && this.cracking.length === 0 && this.falling.length <= Math.max(4, this.liveCount * 0.03);
    if (this.stage === "run" && ((done && t > this.demoAt) || t > this.tMax)) {
      this.stage = "after";
      for (const s of this.falling) this.land(s);
      this.falling = [];
      for (const s of this.cracking) {
        this.detach(s);
        if (s.phase === 2) this.land(s);
      }
      this.cracking = [];
      this.afterAt = t;
      this.initRain();
      this.maxPuffs = this.mobile ? 110 : 230;
      for (const s of this.hanging) s.dropAt = t + this.rand(2500, 11000);
      // The site comes back only on a typed command, never on its own.
      const arm = window.setTimeout(() => this.openPrompt(), 600);
      this.cleanup.push(() => {
        window.clearTimeout(arm);
        this.closePrompt();
      });
    }
    // The first rubble is enough for the fires to start: smoke, embers and
    // short circuits grow with the pile instead of waiting for the collapse to end.
    if (this.stage === "run") {
      const k = clamp((this.landedCount - 6) / Math.max(20, this.liveCount * 0.12), 0, 1);
      if (k > 0) this.ruinFx(dt, k);
    }
    if (this.stage === "after") this.aftermath(dt);
  }

  // --- Reboot prompt ---

  private typed = "";
  private promptError = "";
  private errorUntil = 0;
  private field: HTMLInputElement | null = null;

  /** A hidden text field takes the typing (it also brings up the keyboard on touch screens). */
  private openPrompt(): void {
    const el = document.createElement("input");
    el.type = "text";
    el.setAttribute("aria-label", "terminal");
    el.autocomplete = "off";
    el.spellcheck = false;
    el.autocapitalize = "off";
    el.maxLength = 24;
    el.style.cssText = "position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;border:0;padding:0;pointer-events:none;";
    el.addEventListener("input", () => {
      this.typed = el.value;
    });
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      this.submit();
    });
    const focus = () => el.focus({ preventScroll: true });
    window.addEventListener("pointerdown", focus);
    window.addEventListener("keydown", focus);
    document.body.appendChild(el);
    focus();
    this.field = el;
    this.cleanup.push(() => {
      window.removeEventListener("pointerdown", focus);
      window.removeEventListener("keydown", focus);
    });
  }

  private closePrompt(): void {
    this.field?.remove();
    this.field = null;
  }

  private submit(): void {
    const cmd = this.typed.trim().toLowerCase();
    this.typed = "";
    if (this.field) this.field.value = "";
    if (cmd === "r" || cmd === "reboot") {
      this.beginReboot();
    } else if (cmd) {
      this.promptError = `command not found: ${cmd}`;
      this.errorUntil = this.clock + 2200;
    }
  }

  // --- Camera ---

  private moveCamera(dt: number, t: number): void {
    const max = Math.max(0, this.Hd - this.H);
    let target: number;
    if (t < this.demoAt) target = 0;
    else if (this.stage !== "run" || this.ci >= this.byCrack.length) target = max;
    else target = clamp(this.front - this.H * CAM_LEAD, 0, max);
    const k = t < this.demoAt ? 6 : 3.2;
    const step = (target - this.sy) * (1 - Math.exp(-k * dt));
    const cap = 3200 * dt;
    this.scrollTo(this.sy + clamp(step, -cap, cap));
  }

  private scrollTo(y: number): void {
    window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
    this.sy = window.scrollY;
  }

  // --- Shards ---

  /** The shard leaves the page bitmap and becomes its own little picture. */
  private startCrack(s: Shard): void {
    const r = this.ratio;
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.ceil(s.bw * r));
    cv.height = Math.max(1, Math.ceil(s.bh * r));
    const g = cv.getContext("2d");
    if (!g) {
      s.phase = 4;
      return;
    }
    g.beginPath();
    for (let i = 0; i < s.px.length; i += 2) {
      const x = (s.px[i] - s.bx) * r;
      const y = (s.px[i + 1] - s.by) * r;
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.closePath();
    g.save();
    g.clip();
    // The piece is a solid chunk of the page: a body under what was painted on it (as dark as the page, or as light).
    g.fillStyle = this.light ? "rgba(236,233,247,0.96)" : "rgba(14,10,30,0.94)";
    g.fill();
    g.drawImage(this.page, s.bx * r, s.by * r, s.bw * r, s.bh * r, 0, 0, cv.width, cv.height);
    g.restore();
    g.lineJoin = "round";
    g.lineWidth = 1.4 * r;
    g.strokeStyle = this.light ? "rgba(109,40,217,0.4)" : "rgba(160,130,255,0.35)";
    g.stroke();
    s.cv = cv;
    s.phase = 1;
    this.cracking.push(s);
    // Cut it out of the page, a hair wider so no seam is left behind.
    const p = this.pageCtx;
    p.save();
    p.globalCompositeOperation = "destination-out";
    p.beginPath();
    for (let i = 0; i < s.px.length; i += 2) {
      const x = s.px[i] * r;
      const y = s.px[i + 1] * r;
      if (i) p.lineTo(x, y);
      else p.moveTo(x, y);
    }
    p.closePath();
    p.fill();
    p.lineWidth = 1.6 * r;
    p.lineJoin = "round";
    p.stroke();
    p.restore();
    if (Math.random() < 0.05) this.burstSparks(s.cx, s.cy, 3, 220);
  }

  private detach(s: Shard): void {
    if (s.hang) {
      this.startHang(s);
      return;
    }
    s.phase = 2;
    s.x = s.cx;
    s.y = s.cy;
    s.age = 0;
    this.front = Math.max(this.front, s.cy + s.bh / 2);
    const b = this.bands[s.band];
    const m = clamp(Math.sqrt(s.eff) / 60, 0.5, 2.4);
    const side = s.cx < b.fx ? -1 : 1;
    if (b.style === 0) {
      // Slump: it simply gives way and drops.
      s.vx = this.rand(-30, 30) / m;
      s.vy = this.rand(0, 50);
      s.om = this.rand(-1.4, 1.4) / m;
    } else if (b.style === 1) {
      // Blown outwards from the failure point.
      s.vx = side * this.rand(70, 340) / Math.sqrt(m);
      s.vy = this.rng() < 0.3 ? -this.rand(40, 280) : this.rand(-30, 60);
      s.om = this.rand(-7, 7) / m;
    } else {
      // The whole band topples sideways.
      s.vx = b.dir * this.rand(60, 230);
      s.vy = this.rand(-40, 40);
      s.om = b.dir * this.rand(0.6, 4.2) / Math.sqrt(m);
    }
    if (this.rng() < 0.12) s.om *= 2.4;
    this.falling.push(s);
    if (s.eff > 1400 && Math.random() < 0.5) this.dust(s.cx, s.cy + s.bh / 2, 1, clamp(s.bw * 0.2, 14, 40), true);
  }

  /** It breaks off all but one corner and stays there, tilted. */
  private startHang(s: Shard): void {
    s.phase = 5;
    let top = 0;
    for (let i = 1; i < s.px.length / 2; i++) if (s.px[i * 2 + 1] < s.px[top * 2 + 1]) top = i;
    s.hx = s.px[top * 2];
    s.hy = s.px[top * 2 + 1];
    s.ha = (this.rng() < 0.5 ? -1 : 1) * this.rand(0.28, 0.62);
    s.ph = this.rand(0, TAU);
    s.dropAt = Infinity;
    this.front = Math.max(this.front, s.cy + s.bh / 2);
    this.hanging.push(s);
    this.burstSparks(s.hx, s.hy, 10, 320);
    this.dust(s.cx, s.cy, 2, clamp(s.bw * 0.25, 16, 50), true);
    this.addScorch(s.cx, s.cy, clamp(s.bw * 0.5, 40, 110));
  }

  private release(s: Shard): void {
    const th = this.hangAngle(s);
    const ox = s.cx - s.hx;
    const oy = s.cy - s.hy;
    s.x = s.hx + ox * Math.cos(th) - oy * Math.sin(th);
    s.y = s.hy + ox * Math.sin(th) + oy * Math.cos(th);
    s.a = th;
    const dir = s.ha > 0 ? 1 : -1;
    s.vx = dir * this.rand(15, 60);
    s.vy = 0;
    s.om = dir * this.rand(0.6, 1.8);
    s.age = 0;
    s.phase = 2;
    this.burstSparks(s.hx, s.hy, 12, 360);
    this.dust(s.x, s.y, 2, clamp(s.bw * 0.25, 16, 50), true);
    this.falling.push(s);
  }

  private hangAngle(s: Shard): number {
    return s.ha + Math.sin(this.clock * 0.0022 + s.ph) * 0.035 + Math.sin(this.clock * 0.0057 + s.ph * 2) * 0.012;
  }

  private extents(s: Shard, a: number): [number, number] {
    const c = Math.abs(Math.cos(a));
    const sn = Math.abs(Math.sin(a));
    return [((c * s.bw + sn * s.bh) / 2) * s.sc * 0.78, ((sn * s.bw + c * s.bh) / 2) * s.sc * 0.78];
  }

  private step(s: Shard, dt: number): void {
    s.age += dt;
    s.vy = Math.min(s.vy + this.g * dt, 2600);
    s.vx *= 1 - s.drag * dt;
    if (this.mounds.length && s.age > 0.25) {
      // Rubble drifts towards this run's mounds, so the heap is uneven.
      let nearest = this.mounds[0];
      for (const m of this.mounds) if (Math.abs(m - s.x) < Math.abs(nearest - s.x)) nearest = m;
      s.vx += clamp((nearest - s.x) * 0.2, -50, 50) * dt;
    }
    if (s.age > 0.5 && s.seek === 0) {
      // Look for lower ground close by, so the heap spreads instead of spiking.
      let best = this.binOf(s.x);
      for (let i = Math.max(0, this.binOf(s.x - 200)), e = Math.min(this.heights.length - 1, this.binOf(s.x + 200)); i <= e; i++) if (this.heights[i] < this.heights[best] - 8) best = i;
      s.seek = (best + 0.5) * BIN;
    }
    if (s.seek > 0) s.vx += clamp((s.seek - s.x) * 0.5, -90, 90) * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.a += s.om * dt;
    s.sc = 1 + (s.k - 1) * easeOutCubic(s.age / 0.9);
    const [hw, hh] = this.extents(s, s.a);
    if (s.x - hw < 0) {
      s.x = hw;
      s.vx = Math.abs(s.vx) * 0.4;
    } else if (s.x + hw > this.W) {
      s.x = this.W - hw;
      s.vx = -Math.abs(s.vx) * 0.4;
    }
    // Broad phase on the box, then the real outline against the heap.
    if (s.y + hh / 0.78 < this.floorAt(s.x - hw, s.x + hw)) return;
    this.profile(s, s.a, s.sc, s.x, s.y);
    const gap = this.gapOf();
    if (gap > 0) return;
    s.y += gap;
    const speed = s.vy;
    if (speed > 160 && s.bounces < 3) {
      s.bounces++;
      this.impact(s, speed);
      s.vy = -speed * s.e;
      s.vx *= 0.7;
      s.om *= 0.55;
      // Roll down the side of the heap.
      const slope = this.heightAt(s.x + hw) - this.heightAt(s.x - hw);
      if (Math.abs(slope) > 10) s.vx += clamp(-slope * 1.6, -140, 140);
      return;
    }
    // On a steep spot it cannot stay: it slides off the side of the heap first.
    const slope = this.heightAt(s.x + hw) - this.heightAt(s.x - hw);
    // A couple of gentle nudges at most: kicking it up again and again made
    // pieces hop on the spot for seconds before they finally settled.
    if (Math.abs(slope) > hw * 1.5 && s.slides < 3) {
      s.slides++;
      const dir = slope > 0 ? -1 : 1;
      s.vx += dir * this.rand(90, 180);
      s.vy = -this.rand(4, 14);
      s.om += dir * this.rand(0.3, 1.2);
      return;
    }
    this.land(s);
  }

  private impact(s: Shard, speed: number): void {
    if (s.eff > 2500 && speed > 380 && Math.random() < 0.5) this.addScorch(s.x, s.y + s.bh * 0.3, clamp(s.bw * 0.7, 40, 120));
    this.impulse += clamp((s.eff * s.k * s.k) / 30000, 0, 0.8);
    if (s.eff > 1800 && Math.random() < 0.6) {
      this.dust(s.x, s.y + s.bh * 0.2, 2, clamp(s.bw * 0.2, 14, 44), false);
      if (Math.random() < 0.3) this.burstSparks(s.x, s.y + s.bh * 0.3, 4, 300);
    }
    if (s.eff > 5000 && speed > 400) this.addRing(s.x, s.y + s.bh * 0.3, 8, clamp(s.bw * 0.5, 50, 160), 0.45, 1.6, "rgba(210,200,240,1)");
  }

  /** Comes to rest on the heap: it is baked into the single pile. */
  private land(s: Shard): void {
    if (!s.cv) {
      s.phase = 3;
      this.landedCount++;
      return;
    }
    s.sc = s.k;
    const tall = s.bh > s.bw * 1.6;
    const lean = this.heightAt(s.x + s.bw * 0.3) - this.heightAt(s.x - s.bw * 0.3);
    const base = s.slab ? (lean > 0 ? -1 : 1) * this.rand(0.3, 0.85) : tall ? (this.rng() < 0.5 ? -1 : 1) * (Math.PI / 2) + this.rand(-0.25, 0.25) : this.rand(-0.32, 0.32);
    s.a = base + Math.round((s.a - base) / Math.PI) * Math.PI;
    const [hw] = this.extents(s, s.a);
    const x = clamp(s.x, hw, this.W - hw);
    s.x = x;
    // Rest on the heap: drop until the outlines touch, then turn until it
    // lies on both sides instead of balancing on one corner.
    this.profile(s, s.a, s.sc, x, s.y);
    let gap = this.gapOf();
    if (Number.isFinite(gap)) s.y += gap;
    for (let i = 0; i < 24; i++) {
      this.profile(s, s.a, s.sc, x, s.y);
      const [gl, gr] = this.sideGaps(x);
      if (!Number.isFinite(gl) || !Number.isFinite(gr) || Math.abs(gl - gr) < 2.5) break;
      s.a += (gr > gl ? 1 : -1) * 0.06;
      this.profile(s, s.a, s.sc, x, s.y);
      gap = this.gapOf();
      if (Number.isFinite(gap)) s.y += gap;
    }
    if (!s.slab && this.floorHeight(x - 4, x + 4) > this.pileH * 0.92) {
      // The heap is as high as it goes here: the piece crumbles into it.
      this.dust(x, s.y, 2, clamp(s.bw * 0.25, 14, 40), false);
      s.cv = null;
      s.phase = 3;
      this.landedCount++;
      return;
    }
    // It sinks a little into what is under it.
    s.y += Math.min(5, s.bh * s.sc * 0.04);
    this.profile(s, s.a, s.sc, x, s.y);
    this.settleHeap();
    const r = this.ratio;
    const g = this.pileCtx;
    g.save();
    g.setTransform(r, 0, 0, r, 0, -(this.Hd - this.pileH) * r);
    g.translate(x, s.y);
    g.rotate(s.a);
    g.scale(s.sc, s.sc);
    g.drawImage(s.cv, -s.bw / 2, -s.bh / 2, s.bw, s.bh);
    g.restore();
    if (s.eff > 1200 && this.emitters.length < 60 && this.rng() < 0.5) {
      this.emitters.push({ x, y: s.y, ph: this.rand(0, TAU), next: 0, color: this.rng() < 0.5 ? this.accent : this.accent2 });
    }
    if (s.slab) this.addScorch(x, s.y + 20, 90);
    s.cv = null;
    s.phase = 3;
    this.landedCount++;
  }

  // --- Pile ---

  private vtx = new Float32Array(64);
  private pb = new Float32Array(64);
  private pt = new Float32Array(64);
  private pi0 = 0;
  private pn = 0;

  /** The outline of a shard, seen column by column: where its underside and top are. */
  private profile(s: Shard, a: number, sc: number, x: number, y: number): void {
    const n = s.px.length / 2;
    if (this.vtx.length < n * 2) this.vtx = new Float32Array(n * 2);
    const c = Math.cos(a);
    const sn = Math.sin(a);
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < n; i++) {
      const lx = s.px[i * 2] - s.cx;
      const ly = s.px[i * 2 + 1] - s.cy;
      const vx = x + (lx * c - ly * sn) * sc;
      this.vtx[i * 2] = vx;
      this.vtx[i * 2 + 1] = y + (lx * sn + ly * c) * sc;
      minX = Math.min(minX, vx);
      maxX = Math.max(maxX, vx);
    }
    const i0 = this.binOf(minX);
    const count = this.binOf(maxX) - i0 + 1;
    if (this.pb.length < count) {
      this.pb = new Float32Array(count);
      this.pt = new Float32Array(count);
    }
    for (let k = 0; k < count; k++) {
      const X = (i0 + k + 0.5) * BIN;
      let lo = Infinity;
      let hi = -Infinity;
      for (let j = 0; j < n; j++) {
        const ax = this.vtx[j * 2];
        const ay = this.vtx[j * 2 + 1];
        const l = ((j + 1) % n) * 2;
        const bx = this.vtx[l];
        const by = this.vtx[l + 1];
        if ((ax <= X && X < bx) || (bx <= X && X < ax)) {
          const yy = ay + ((X - ax) / (bx - ax)) * (by - ay);
          if (yy < lo) lo = yy;
          if (yy > hi) hi = yy;
        }
      }
      this.pt[k] = lo;
      this.pb[k] = hi;
    }
    this.pi0 = i0;
    this.pn = count;
  }

  /** How far the last outline is above the heap (negative: sunk into it). */
  private gapOf(): number {
    let gap = Infinity;
    for (let k = 0; k < this.pn; k++) {
      const g = this.Hd - this.heights[this.pi0 + k] - this.pb[k];
      if (g < gap) gap = g;
    }
    return gap;
  }

  /** How far each half of the last outline is above the heap. */
  private sideGaps(x: number): [number, number] {
    let gl = Infinity;
    let gr = Infinity;
    for (let k = 0; k < this.pn; k++) {
      const g = this.Hd - this.heights[this.pi0 + k] - this.pb[k];
      if ((this.pi0 + k + 0.5) * BIN < x) {
        if (g < gl) gl = g;
      } else if (g < gr) gr = g;
    }
    return [gl, gr];
  }

  /** The heap's surface now follows the top of the piece that just settled. */
  private settleHeap(): void {
    for (let k = 0; k < this.pn; k++) {
      const h = this.Hd - this.pt[k];
      const i = this.pi0 + k;
      if (h > this.heights[i]) this.heights[i] = h;
    }
  }

  private binOf(x: number): number {
    return clamp(Math.floor(x / BIN), 0, this.heights.length - 1);
  }

  private floorHeight(x0: number, x1: number): number {
    return this.Hd - this.floorAt(x0, x1);
  }

  private heightAt(x: number): number {
    return this.heights[this.binOf(x)];
  }

  private floorAt(x0: number, x1: number): number {
    let top = 0;
    for (let i = this.binOf(x0), e = this.binOf(x1); i <= e; i++) top = Math.max(top, this.heights[i]);
    return this.Hd - top;
  }

  // --- Particles ---

  private addRing(x: number, y: number, r: number, to: number, life: number, width: number, color: string): void {
    this.rings.push({ x, y, r, speed: (to - r) / life, life, max: life, width, color });
  }

  private burstSparks(x: number, y: number, n: number, speed: number): void {
    const palette = [this.warm, this.warm, this.accent2, this.accent, "#ffffff"];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = speed * (0.25 + Math.random() * 0.75);
      const life = 0.3 + Math.random() * 0.6;
      this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.2, life, max: life, color: palette[Math.floor(Math.random() * palette.length)], grav: 1100 });
    }
  }

  private dust(x: number, y: number, n: number, r: number, warm: boolean): void {
    for (let i = 0; i < n && this.puffs.length < this.maxPuffs; i++) {
      const life = warm ? 0.5 + Math.random() * 0.6 : 1.1 + Math.random() * 1.5;
      this.puffs.push({
        x: x + (Math.random() * 2 - 1) * r,
        y: y + (Math.random() * 0.6 - 0.3) * r,
        vx: Math.random() * 80 - 40,
        vy: -8 - Math.random() * 47,
        r: r * (0.5 + Math.random() * 0.5),
        grow: warm ? 8 + Math.random() * 12 : 18 + Math.random() * 28,
        life,
        max: life,
        alpha: warm ? 0.1 + Math.random() * 0.1 : 0.18 + Math.random() * 0.2,
        warm,
      });
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 0.6 * dt;
      p.r += p.grow * dt;
      if (p.life <= 0) this.puffs.splice(i, 1);
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;
      s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.y > this.Hd) this.sparks.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      r.r += r.speed * dt;
      if (r.life <= 0) this.rings.splice(i, 1);
    }
  }

  /** A scorch mark and a few glowing fissures burned into the background. */
  private addScorch(x: number, y: number, r: number): void {
    const g = this.decalCtx;
    if (!g || this.scorches > 90) return;
    this.scorches++;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(0,0,0,${this.light ? 0.26 : 0.5})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
    g.lineCap = "round";
    g.lineJoin = "round";
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      let ang = Math.random() * TAU;
      let cx = x;
      let cy = y;
      g.beginPath();
      g.moveTo(cx, cy);
      const segs = 5 + Math.floor(Math.random() * 5);
      for (let k = 0; k < segs; k++) {
        ang += (Math.random() - 0.5) * 1.1;
        const len = r * (0.18 + Math.random() * 0.28);
        cx += Math.cos(ang) * len;
        cy += Math.sin(ang) * len;
        g.lineTo(cx, cy);
      }
      g.strokeStyle = "rgba(34,211,238,0.22)";
      g.lineWidth = 3.5;
      g.stroke();
      g.strokeStyle = "rgba(4,2,12,0.85)";
      g.lineWidth = 1.2;
      g.stroke();
    }
  }

  private heapY(x: number): number {
    return this.Hd - this.heights[this.binOf(x)];
  }

  /** Matrix-style digital rain: one glyph atlas, a column of glyphs per stream. */
  private initRain(): void {
    const chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:=*+-<>¦";
    const cw = this.mobile ? 12 : 14;
    const ch = this.mobile ? 14 : 16;
    this.rainCell = [cw, ch];
    const atlas = document.createElement("canvas");
    atlas.width = cw * chars.length;
    atlas.height = ch * 2;
    const g = atlas.getContext("2d");
    if (!g) return;
    g.font = `${ch - 3}px ui-monospace, "MS Gothic", "Noto Sans Mono CJK JP", monospace`;
    g.textBaseline = "middle";
    g.textAlign = "center";
    for (let i = 0; i < chars.length; i++) {
      g.fillStyle = this.light ? "#0b7d57" : "#35f0a4";
      g.shadowColor = this.light ? "#0b7d57" : "#35f0a4";
      g.shadowBlur = 4;
      g.fillText(chars[i], i * cw + cw / 2, ch / 2);
      g.fillStyle = this.light ? "#064e3b" : "#eafff6";
      g.shadowColor = this.light ? "#10b981" : "#7dffd0";
      g.shadowBlur = 6;
      g.fillText(chars[i], i * cw + cw / 2, ch + ch / 2);
    }
    this.glyphs = atlas;
    const cols = Math.floor(this.W / (cw * 1.15));
    for (let i = 0; i < cols; i++) {
      if (Math.random() < 0.15) continue;
      this.rain.push(this.newStream(i * cw * 1.15, true));
    }
  }

  private newStream(x: number, spread: boolean): { x: number; y: number; v: number; acc: number; g: number[] } {
    const len = 8 + Math.floor(Math.random() * 18);
    return {
      x,
      y: spread ? Math.random() * this.H : -Math.random() * this.H * 0.6,
      v: 90 + Math.random() * 260,
      acc: 0,
      g: Array.from({ length: len }, () => Math.floor(Math.random() * 60)),
    };
  }

  private updateRain(dt: number): void {
    const [, ch] = this.rainCell;
    for (let i = 0; i < this.rain.length; i++) {
      const c = this.rain[i];
      c.y += c.v * dt;
      c.acc += c.v * dt;
      while (c.acc >= ch) {
        c.acc -= ch;
        c.g.unshift(Math.floor(Math.random() * 60));
        c.g.pop();
      }
      if (Math.random() < dt * 2) c.g[Math.floor(Math.random() * c.g.length)] = Math.floor(Math.random() * 60);
      if (c.y - c.g.length * ch > this.H) this.rain[i] = this.newStream(c.x, false);
    }
  }

  /** Behind the rubble, in front of the page background. */
  private drawRain(ctx: CanvasRenderingContext2D): void {
    if (!this.glyphs) return;
    const [cw, ch] = this.rainCell;
    const fade = clamp((this.clock - this.afterAt - 400) / 2500, 0, 1) * 0.95;
    if (fade <= 0) return;
    for (const c of this.rain) {
      for (let k = 0; k < c.g.length; k++) {
        const y = c.y - k * ch;
        if (y < -ch || y > this.H) continue;
        ctx.globalAlpha = fade * (k === 0 ? 1 : Math.pow(1 - k / c.g.length, 1.6) * 0.75);
        ctx.drawImage(this.glyphs, c.g[k] * cw, k === 0 ? ch : 0, cw, ch, c.x, y, cw, ch);
      }
    }
    ctx.globalAlpha = 1;
  }

  private smoke(x: number, y: number): void {
    if (this.puffs.length >= this.maxPuffs) return;
    const life = 2.6 + Math.random() * 2.4;
    this.puffs.push({ x, y, vx: Math.random() * 30 - 15, vy: -(22 + Math.random() * 38), r: 24 + Math.random() * 30, grow: 10 + Math.random() * 16, life, max: life, alpha: 0.2 + Math.random() * 0.16, warm: false });
  }

  private aftermath(dt: number): void {
    this.updateRain(dt);
    this.ruinFx(dt, 1);
    // The lights keep failing: now and then a surge washes the dimming out.
    if (this.clock >= this.surgeAt) {
      this.surgeUntil = this.clock + 60 + Math.random() * 110;
      this.surgeAt = this.clock + 1300 + Math.random() * 4200;
    }
    this.flick = this.clock < this.surgeUntil ? 0.3 : 1 + (Math.random() - 0.5) * 0.14;
  }

  /** Smoke, embers and short circuits over the rubble; `k` (0-1) scales how much. */
  private ruinFx(dt: number, k: number): void {
    const rate = (per: number) => Math.random() < dt * per * k;
    // Smoke rising from the rubble.
    if (rate(this.mobile ? 6 : 12)) {
      const x = Math.random() * this.W;
      this.smoke(x, this.heapY(x) - 4);
    }
    // Neon embers drifting up over the whole heap.
    if (rate(this.mobile ? 10 : 22)) {
      const x = Math.random() * this.W;
      this.sparks.push({
        x,
        y: this.heapY(x) - 2,
        vx: Math.random() * 50 - 25,
        vy: -50 - Math.random() * 130,
        life: 1.6 + Math.random() * 2.4,
        max: 4,
        color: Math.random() < 0.5 ? this.accent : this.accent2,
        grav: -14,
      });
    }
    // Damaged pieces that keep short-circuiting.
    for (const e of this.emitters) {
      if (this.clock < e.next || k < 0.3) continue;
      e.next = this.clock + 500 + Math.random() * 4200;
      this.burstSparks(e.x, e.y, 4 + Math.floor(Math.random() * 6), 260);
      if (Math.random() < 0.4) this.smoke(e.x, e.y - 6);
    }
  }

  // --- Reboot ---

  private beginReboot(): void {
    if (this.stage === "reboot") return;
    this.stage = "reboot";
    this.rebootAt = performance.now();
    // The site comes back at its top, with no section hash or query left in the URL.
    if (window.location.hash || window.location.search) window.history.replaceState(null, "", window.location.pathname);
    for (const fn of this.cleanup.splice(0)) fn();
    glitchScreen();
    glitchStorm(900);
    this.hint?.classList.remove("is-shown");
    this.camReboot = this.sy;
    // The real page comes back underneath while the ruins dissolve.
    for (const fn of this.hidden.splice(0)) fn();
  }

  private updateReboot(now: number): void {
    const p = easeOutCubic((now - this.rebootAt) / T_REBOOT);
    this.shakeX = this.shakeY = 0;
    this.scrollTo(this.camReboot * (1 - p));
    this.updateParticles(0.016);
    this.canvas.style.opacity = String(1 - p);
  }

  private finish(): void {
    cancelAnimationFrame(this.raf);
    for (const fn of this.cleanup.splice(0)) fn();
    for (const fn of this.hidden.splice(0)) fn();
    this.scrollTo(0);
    this.canvas.remove();
    this.hint?.remove();
    document.documentElement.classList.remove("demolishing");
    if (this.root) this.root.inert = false;
    this.resolve();
  }

  // --- Drawing ---

  private sprite(inner: string, outer: string): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    if (g) {
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, inner);
      grad.addColorStop(1, outer);
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    }
    return c;
  }

  private draw(): void {
    const ctx = this.ctx;
    const r = this.ratio;
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.save();
    ctx.translate(this.shakeX * 0.5, this.shakeY * 0.5);

    // Scorch marks and fissures in the background, under what is left of the page.
    if (this.decal) {
      const dy = clamp(this.sy, 0, Math.max(0, this.Hd - this.H));
      ctx.drawImage(this.decal, 0, dy, this.W, this.H, 0, 0, this.W, this.H);
    }

    // What is left of the page, straight from the bitmap.
    const sy = clamp(this.sy, 0, Math.max(0, this.page.height / r - this.H));
    ctx.drawImage(this.page, 0, sy * r, this.W * r, this.H * r, 0, 0, this.W, this.H);

    if (this.stage !== "run") this.drawRain(ctx);

    ctx.translate(0, -this.sy);
    this.drawHeap(ctx);
    ctx.drawImage(this.pile, 0, this.Hd - this.pileH, this.W, this.pileH);
    this.drawPuffs(ctx, false);

    const top = this.sy - 120;
    const bottom = this.sy + this.H + 120;
    for (const s of this.cracking) {
      if (!s.cv || s.y + s.bh / 2 < top || s.y - s.bh / 2 > bottom) continue;
      this.drawShard(ctx, s);
      this.drawCracks(ctx, s);
    }
    for (const s of this.falling) {
      if (!s.cv || s.y + s.bh < top || s.y - s.bh > bottom) continue;
      this.drawShard(ctx, s);
    }

    for (const s of this.hanging) this.drawHanging(ctx, s);

    ctx.globalCompositeOperation = "lighter";
    {
      for (const e of this.emitters) {
        if (e.y < top || e.y > bottom) continue;
        const pulse = 0.5 + 0.5 * Math.sin(this.clock * 0.006 + e.ph) * Math.sin(this.clock * 0.0023 + e.ph * 3);
        const gr = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 70);
        gr.addColorStop(0, e.color);
        gr.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 0.05 + pulse * 0.2;
        ctx.fillStyle = gr;
        ctx.fillRect(e.x - 70, e.y - 70, 140, 140);
      }
      ctx.globalAlpha = 1;
    }
    for (const s of this.sparks) {
      const k = s.life / s.max;
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = clamp(k * 1.4, 0, 1);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 0.035, s.y - s.vy * 0.035);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const ring of this.rings) {
      const k = ring.life / ring.max;
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = clamp(k, 0, 1) * 0.9;
      ctx.lineWidth = ring.width * (0.4 + k);
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    this.drawPuffs(ctx, true);
    ctx.restore();
    this.drawDim(ctx);
    if (this.stage === "after") this.drawCrash(ctx);
  }

  private drawHanging(ctx: CanvasRenderingContext2D, s: Shard): void {
    if (!s.cv || s.hy + s.bh < this.sy - 120 || s.hy - s.bh > this.sy + this.H + 700) return;
    // A torn cable it still dangles from, sparking at the break.
    const sway = Math.sin(this.clock * 0.0019 + s.ph) * 12;
    ctx.save();
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(s.hx, s.hy);
    ctx.quadraticCurveTo(s.hx + sway, s.hy - 260, s.hx + sway * 0.4, s.hy - 760);
    ctx.strokeStyle = "rgba(8,6,18,0.95)";
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.strokeStyle = "rgba(34,211,238,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(s.hx, s.hy);
    ctx.rotate(this.hangAngle(s));
    ctx.translate(-s.hx, -s.hy);
    ctx.drawImage(s.cv, s.cx - s.bw / 2, s.cy - s.bh / 2, s.bw, s.bh);
    // Its fracture stays lit.
    ctx.beginPath();
    ctx.moveTo(s.px[0], s.px[1]);
    for (let i = 2; i < s.px.length; i += 2) ctx.lineTo(s.px[i], s.px[i + 1]);
    ctx.closePath();
    ctx.strokeStyle = "rgba(34,211,238,0.5)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  /** Power failing: a darkening vignette that flickers. */
  private drawDim(ctx: CanvasRenderingContext2D): void {
    // On a light page the dimming is half as strong: it is a shade, not a blackout.
    const a = this.dim * this.flick * (this.light ? 0.5 : 1);
    if (a < 0.01) return;
    const R = Math.max(this.W, this.H) * 0.75;
    const g = ctx.createRadialGradient(this.W / 2, this.H * 0.45, this.H * 0.3, this.W / 2, this.H * 0.45, R);
    g.addColorStop(0, `rgba(3,2,10,${(a * 0.25).toFixed(3)})`);
    g.addColorStop(1, `rgba(3,2,10,${a.toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.H);
  }

  /** Site colours for the crash window, read once from the page's theme. */
  private theme: Record<"bg" | "surface" | "surface2" | "border" | "text" | "muted" | "danger" | "ok" | "type", string> | null = null;

  private themeColors() {
    if (!this.theme) {
      const css = getComputedStyle(document.documentElement);
      const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
      this.theme = {
        bg: v("--color-bg", "#07060d"),
        surface: v("--color-surface", "#100e19"),
        surface2: v("--color-surface-2", "#161324"),
        border: v("--color-border", "#282340"),
        text: v("--color-text", "#ebe9f5"),
        muted: v("--color-muted", "#8d89a6"),
        danger: v("--color-danger", "#f87171"),
        ok: v("--color-syn-number", "#86efac"),
        type: v("--color-syn-type", "#fcd34d"),
      };
    }
    return this.theme;
  }

  /** The system-down window: the same editor-window chrome the site uses
   * (title bar with file name and window controls, body, status bar), opened
   * over the ruins. Its body is split into separate sections: header,
   * diagnostics, integrity and a terminal that waits for the reboot command. */
  private drawCrash(ctx: CanvasRenderingContext2D): void {
    const t = this.clock - this.afterAt - 100;
    if (t < 0) return;
    const c = this.themeColors();
    const mono = '"JetBrains Mono", ui-monospace, Consolas, monospace';
    const u = this.mobile ? 0.85 : 1;
    const w = Math.min(this.W - 24, 540 * u);
    const pad = 20 * u;
    const gap = 16 * u;
    const titleH = 36 * u;
    const statusH = 28 * u;
    const rowH = 25 * u;
    const rows: Array<[string, string, string]> = [
      ["shards", String(this.liveCount), c.type],
      ["sections", "all lost", c.danger],
      ["content", "preserved", c.ok],
      ["collapse", `${(this.afterAt / 1000).toFixed(1)} s`, this.accent],
      ["signature", "0x51616C6962", c.text],
    ];
    const headH = 42 * u;
    const cardPad = 12 * u;
    const labelH = 22 * u;
    const cardH = cardPad + labelH + rows.length * rowH + cardPad * 0.6;
    const integH = 34 * u;
    ctx.font = `${12 * u}px ${mono}`;
    const hintLines = wrapText(ctx, this.options.hint, w - pad * 2 - cardPad * 2);
    const termStrip = 26 * u;
    const termH = termStrip + cardPad + hintLines.length * 18 * u + 10 * u + 22 * u + 20 * u + cardPad * 0.5;
    const bodyH = pad + headH + gap + cardH + gap + integH + gap + termH + pad;
    const h = titleH + bodyH + statusH;
    const open = easeOutCubic(t / 380);
    // Something is broken, so the window never sits still: a burst every second or so.
    const glitch = this.clock % 1300 < 170 || this.clock % 3700 < 330;
    const x = Math.round((this.W - w) / 2) + (glitch ? (Math.random() - 0.5) * 9 : 0);
    const y = Math.round(Math.max(12, Math.min(this.H * 0.06, this.H - h - 12))) + (1 - open) * -12;
    const rr = (px: number, py: number, pw: number, ph: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(px + r, py);
      ctx.arcTo(px + pw, py, px + pw, py + ph, r);
      ctx.arcTo(px + pw, py + ph, px, py + ph, r);
      ctx.arcTo(px, py + ph, px, py, r);
      ctx.arcTo(px, py, px + pw, py, r);
      ctx.closePath();
    };
    const R = 12 * u;
    ctx.save();
    ctx.globalAlpha = open;
    ctx.textBaseline = "middle";

    // Window body: the site's surface with a soft shadow.
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    rr(x, y, w, h, R);
    ctx.fillStyle = c.surface;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.save();
    rr(x, y, w, h, R);
    ctx.clip();
    ctx.fillStyle = c.surface2;
    ctx.fillRect(x, y, w, titleH);
    ctx.fillStyle = c.border;
    ctx.fillRect(x, y + titleH - 1, w, 1);
    const sy = y + h - statusH;
    ctx.fillStyle = c.surface2;
    ctx.fillRect(x, sy, w, statusH);
    ctx.fillStyle = c.border;
    ctx.fillRect(x, sy, w, 1);
    ctx.restore();

    ctx.lineWidth = 1;
    rr(x + 0.5, y + 0.5, w - 1, h - 1, R);
    ctx.strokeStyle = glitch ? this.accent2 : c.border;
    ctx.stroke();
    if (glitch) {
      ctx.save();
      ctx.translate(3, 0);
      rr(x + 0.5, y + 0.5, w - 1, h - 1, R);
      ctx.strokeStyle = this.accent;
      ctx.globalAlpha = open * 0.7;
      ctx.stroke();
      ctx.restore();
    }

    // Title bar: file badge and name on the left, disabled window controls on the right.
    const bs = 16 * u;
    const bx = x + 16 * u;
    const by = y + titleH / 2 - bs / 2;
    rr(bx, by, bs, bs, 4 * u);
    ctx.fillStyle = c.surface;
    ctx.fill();
    ctx.strokeStyle = c.border;
    ctx.stroke();
    ctx.font = `700 ${10 * u}px ${mono}`;
    ctx.textAlign = "center";
    ctx.fillStyle = c.danger;
    ctx.fillText("!", bx + bs / 2, by + bs / 2 + 0.5);
    ctx.font = `${12 * u}px ${mono}`;
    ctx.textAlign = "left";
    ctx.fillStyle = c.muted;
    ctx.fillText("fatal-error.log", bx + bs + 8 * u, y + titleH / 2 + 0.5);
    const cw = 22 * u;
    const cx0 = x + w - 8 * u - cw * 3 - 2 * u * 2;
    const my = y + titleH / 2;
    ctx.lineWidth = 1.3;
    ctx.lineCap = "round";
    ctx.globalAlpha = open * 0.35; // all three controls are disabled, like the site's inert ones
    ctx.strokeStyle = c.muted;
    ctx.beginPath();
    ctx.moveTo(cx0 + cw / 2 - 5 * u, my);
    ctx.lineTo(cx0 + cw / 2 + 5 * u, my);
    ctx.stroke();
    const sqx = cx0 + cw + 2 * u + cw / 2;
    ctx.strokeRect(sqx - 4.5 * u, my - 4.5 * u, 9 * u, 9 * u);
    const xx = cx0 + (cw + 2 * u) * 2 + cw / 2;
    ctx.beginPath();
    ctx.moveTo(xx - 4.5 * u, my - 4.5 * u);
    ctx.lineTo(xx + 4.5 * u, my + 4.5 * u);
    ctx.moveTo(xx + 4.5 * u, my - 4.5 * u);
    ctx.lineTo(xx - 4.5 * u, my + 4.5 * u);
    ctx.stroke();
    ctx.globalAlpha = open;
    ctx.lineWidth = 1;

    const pulse = 0.65 + 0.35 * Math.sin(this.clock * 0.005);
    const innerW = w - pad * 2;

    // --- Section 1: header ---
    const hy = y + titleH + pad;
    const bd = 40 * u;
    ctx.save();
    ctx.shadowColor = c.danger;
    ctx.shadowBlur = 14 * pulse;
    rr(x + pad, hy, bd, bd, 10 * u);
    ctx.fillStyle = "rgba(248,113,113,0.12)";
    ctx.fill();
    ctx.restore();
    rr(x + pad, hy, bd, bd, 10 * u);
    ctx.strokeStyle = "rgba(248,113,113,0.45)";
    ctx.stroke();
    ctx.font = `700 ${20 * u}px ${mono}`;
    ctx.textAlign = "center";
    ctx.fillStyle = c.danger;
    ctx.fillText("!", x + pad + bd / 2, hy + bd / 2 + 1);
    ctx.textAlign = "left";
    const tx = x + pad + bd + 14 * u;
    const head = "System down";
    const sub = "layout tree collapsed";
    const hShown = Math.max(0, Math.floor((t - 150) / 38));
    ctx.font = `700 ${20 * u}px ${mono}`;
    // A cyan and a red ghost of the headline, always on, stronger in a burst.
    const split = glitch ? 3 : 1.2 + Math.sin(this.clock * 0.004);
    ctx.globalAlpha = open * (glitch ? 0.85 : 0.4);
    ctx.fillStyle = this.accent2;
    ctx.fillText(head.slice(0, hShown), tx - split, hy + 11 * u);
    ctx.fillStyle = c.danger;
    ctx.fillText(head.slice(0, hShown), tx + split, hy + 11 * u);
    ctx.globalAlpha = open;
    ctx.fillStyle = c.text;
    ctx.fillText(head.slice(0, hShown), tx, hy + 11 * u);
    ctx.font = `${12 * u}px ${mono}`;
    ctx.fillStyle = c.danger;
    ctx.fillText(sub.slice(0, Math.max(0, Math.floor((t - 600) / 22))), tx, hy + 31 * u);

    // --- Section 2: diagnostics card ---
    const ay = hy + headH + gap;
    rr(x + pad, ay, innerW, cardH, 8 * u);
    ctx.fillStyle = c.surface2;
    ctx.fill();
    ctx.strokeStyle = c.border;
    ctx.stroke();
    ctx.font = `700 ${10 * u}px ${mono}`;
    ctx.fillStyle = c.muted;
    ctx.fillText("DIAGNOSTICS", x + pad + cardPad, ay + cardPad + labelH / 2 - 4 * u);
    ctx.textAlign = "right";
    ctx.fillStyle = this.accent2;
    ctx.fillText("layout.tree", x + pad + innerW - cardPad, ay + cardPad + labelH / 2 - 4 * u);
    ctx.textAlign = "left";
    const ry = ay + cardPad + labelH;
    ctx.fillStyle = c.border;
    ctx.fillRect(x + pad + cardPad, ry - 3 * u, innerW - cardPad * 2, 1);
    ctx.font = `${12.5 * u}px ${mono}`;
    rows.forEach(([k, v, color], i) => {
      const start = 900 + i * 240;
      const cy = ry + i * rowH + rowH / 2 + 1 * u;
      if (t < start) return;
      ctx.textAlign = "right";
      ctx.fillStyle = c.muted;
      ctx.globalAlpha = open * 0.5;
      ctx.fillText(String(i + 1), x + pad + cardPad + 8 * u, cy);
      ctx.globalAlpha = open;
      ctx.textAlign = "left";
      ctx.fillStyle = this.accent2;
      ctx.fillText(k, x + pad + cardPad + 24 * u, cy);
      const shown = Math.floor((t - start) / 20);
      ctx.textAlign = "right";
      ctx.fillStyle = color;
      ctx.fillText(v.slice(0, Math.max(0, shown)), x + pad + innerW - cardPad, cy);
    });
    ctx.textAlign = "left";

    // --- Section 3: integrity ---
    const iy = ay + cardH + gap;
    const fill = clamp((t - 1900) / 900, 0, 1);
    ctx.font = `${11 * u}px ${mono}`;
    ctx.fillStyle = c.muted;
    ctx.fillText("content integrity", x + pad, iy + 6 * u);
    ctx.textAlign = "right";
    ctx.fillStyle = c.ok;
    ctx.fillText(`${Math.round(fill * 100)}%`, x + pad + innerW, iy + 6 * u);
    ctx.textAlign = "left";
    rr(x + pad, iy + 18 * u, innerW, 6 * u, 3 * u);
    ctx.fillStyle = c.border;
    ctx.fill();
    if (fill > 0) {
      const bar = ctx.createLinearGradient(x + pad, 0, x + pad + innerW, 0);
      bar.addColorStop(0, this.accent);
      bar.addColorStop(1, this.accent2);
      ctx.fillStyle = bar;
      rr(x + pad, iy + 18 * u, innerW * fill, 6 * u, 3 * u);
      ctx.fill();
    }

    // --- Section 4: the terminal that waits for the reboot command ---
    const ty = iy + integH + gap;
    ctx.save();
    rr(x + pad, ty, innerW, termH, 8 * u);
    ctx.clip();
    ctx.fillStyle = c.bg;
    ctx.fillRect(x + pad, ty, innerW, termH);
    ctx.fillStyle = c.surface2;
    ctx.fillRect(x + pad, ty, innerW, termStrip);
    ctx.fillStyle = c.border;
    ctx.fillRect(x + pad, ty + termStrip - 1, innerW, 1);
    ctx.restore();
    rr(x + pad + 0.5, ty + 0.5, innerW - 1, termH - 1, 8 * u);
    ctx.strokeStyle = c.border;
    ctx.stroke();
    ctx.font = `${11 * u}px ${mono}`;
    ctx.fillStyle = this.accent;
    ctx.fillText(">_", x + pad + cardPad, ty + termStrip / 2 + 0.5);
    ctx.fillStyle = c.muted;
    ctx.fillText("terminal", x + pad + cardPad + 24 * u, ty + termStrip / 2 + 0.5);
    ctx.textAlign = "right";
    ctx.fillStyle = c.muted;
    ctx.fillText("bash", x + pad + innerW - cardPad, ty + termStrip / 2 + 0.5);
    ctx.textAlign = "left";
    if (t > 2300) {
      ctx.font = `${12 * u}px ${mono}`;
      let left = Math.floor((t - 2300) / 16);
      const py = ty + termStrip + cardPad + 6 * u;
      hintLines.forEach((line, i) => {
        const part = line.slice(0, Math.max(0, left));
        left -= line.length;
        ctx.fillStyle = c.muted;
        ctx.fillText(part, x + pad + cardPad, py + i * 18 * u);
      });
      if (left > 0) {
        const ly = py + hintLines.length * 18 * u + 14 * u;
        let px = x + pad + cardPad;
        const seg = (text: string, color: string) => {
          ctx.fillStyle = color;
          ctx.fillText(text, px, ly);
          px += ctx.measureText(text).width;
        };
        seg("root@site", c.ok);
        seg(":", c.muted);
        seg("~", this.accent2);
        seg("$ ", c.text);
        seg(this.typed, c.text);
        if (Math.floor(this.clock / 450) % 2 === 0) {
          ctx.fillStyle = this.accent;
          ctx.fillRect(px + 1, ly - 6.5 * u, 7 * u, 13 * u);
        }
        if (this.clock < this.errorUntil) {
          ctx.fillStyle = c.danger;
          ctx.fillText(`✕ ${this.promptError}`, x + pad + cardPad, ly + 20 * u);
        }
      }
    }

    // --- Status bar, like the hero window's ---
    ctx.font = `${11 * u}px ${mono}`;
    const sm = sy + statusH / 2 + 0.5;
    ctx.beginPath();
    ctx.arc(x + 16 * u, sm, 3 * u, 0, TAU);
    ctx.fillStyle = c.danger;
    ctx.globalAlpha = open * (0.5 + 0.5 * pulse);
    ctx.fill();
    ctx.globalAlpha = open;
    ctx.fillStyle = c.danger;
    ctx.fillText("ERR", x + 26 * u, sm);
    ctx.textAlign = "right";
    ctx.fillStyle = c.muted;
    ctx.fillText("UTF-8   LF", x + w - 16 * u, sm);
    ctx.textAlign = "left";
    // Burst: horizontal slices of the window slip sideways.
    if (glitch) {
      const r = this.ratio;
      for (let i = 0; i < 3; i++) {
        const sy2 = y + Math.random() * h * 0.9;
        const sh = 4 + Math.random() * 16 * u;
        ctx.drawImage(this.canvas, x * r, sy2 * r, w * r, sh * r, x + (Math.random() - 0.5) * 26, sy2, w, sh);
      }
    }
    ctx.restore();
  }

  private drawShard(ctx: CanvasRenderingContext2D, s: Shard): void {
    if (!s.cv) return;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.a);
    ctx.scale(s.sc, s.sc);
    ctx.drawImage(s.cv, -s.bw / 2, -s.bh / 2, s.bw, s.bh);
    ctx.restore();
  }

  /** Glowing fracture lines: the outline of the piece and the cracks running into it. */
  private drawCracks(ctx: CanvasRenderingContext2D, s: Shard): void {
    const p = clamp((this.clock - s.crackStart) / Math.max(1, s.trigger - s.crackStart), 0, 1);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.a);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const stroke = (pts: number[], count: number, ox: number, oy: number) => {
      ctx.beginPath();
      ctx.moveTo(pts[0] - ox, pts[1] - oy);
      for (let i = 1; i < count; i++) ctx.lineTo(pts[i * 2] - ox, pts[i * 2 + 1] - oy);
    };
    ctx.globalAlpha = s.eff > 1200 ? Math.min(1, p * 1.6) * 0.55 : 0;
    const n = s.px.length / 2;
    const upto = Math.max(2, Math.round(n * Math.min(1, p * 1.4)));
    stroke(s.px, upto, s.cx, s.cy);
    ctx.strokeStyle = this.light ? "rgba(109,40,217,0.3)" : "rgba(34,211,238,0.35)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = this.light ? "rgba(30,20,60,0.9)" : "rgba(235,250,255,0.9)";
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.globalAlpha = 1;
    for (const line of s.cracks) {
      const count = Math.max(2, Math.round((line.length / 2) * p));
      stroke(line, count, 0, 0);
      ctx.strokeStyle = this.light ? "rgba(109,40,217,0.3)" : "rgba(34,211,238,0.35)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = this.light ? "rgba(30,20,60,0.95)" : "rgba(235,250,255,0.95)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawPuffs(ctx: CanvasRenderingContext2D, warm: boolean): void {
    for (const p of this.puffs) {
      if (p.warm !== warm) continue;
      ctx.globalAlpha = p.alpha * Math.min(1, (p.life / p.max) * 2);
      ctx.drawImage(p.warm ? this.warmSprite : this.puffSprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalAlpha = 1;
  }

  /** A dim body under the settled pieces, so gaps between them read as shadow. */
  private drawHeap(ctx: CanvasRenderingContext2D): void {
    let max = 0;
    for (let i = 0; i < this.heights.length; i++) max = Math.max(max, this.heights[i]);
    if (max < 4) return;
    ctx.beginPath();
    ctx.moveTo(0, this.Hd + 4);
    for (let x = 0; x <= this.W + BIN; x += BIN) {
      const h = this.heights[this.binOf(x)];
      ctx.lineTo(x, this.Hd - Math.max(0, h));
    }
    ctx.lineTo(this.W + BIN, this.Hd + 4);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, this.Hd - max, 0, this.Hd);
    g.addColorStop(0, this.light ? "rgba(168,160,190,0.7)" : "rgba(14,10,28,0.85)");
    g.addColorStop(1, this.light ? "rgba(112,102,142,0.9)" : "rgba(5,3,12,0.97)");
    ctx.fillStyle = g;
    ctx.fill();
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const word of text.split(/\s+/)) {
    const test = cur ? `${cur} ${word}` : word;
    if (cur && ctx.measureText(test).width > maxW) {
      lines.push(cur);
      cur = word;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Keeps the part of the polygon on the seed's side of a bisector. */
function clipHalf(poly: number[], mx: number, my: number, nx: number, ny: number): number[] {
  const out: number[] = [];
  const n = poly.length / 2;
  const side = (x: number, y: number) => (x - mx) * nx + (y - my) * ny;
  for (let i = 0; i < n; i++) {
    const ax = poly[i * 2];
    const ay = poly[i * 2 + 1];
    const bx = poly[((i + 1) % n) * 2];
    const by = poly[((i + 1) % n) * 2 + 1];
    const da = side(ax, ay);
    const db = side(bx, by);
    if (da <= 0) out.push(ax, ay);
    if (da <= 0 !== db <= 0) {
      const t = da / (da - db);
      out.push(ax + (bx - ax) * t, ay + (by - ay) * t);
    }
  }
  return out;
}

function polyArea(p: number[]): number {
  let a = 0;
  const n = p.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += p[i * 2] * p[j * 2 + 1] - p[j * 2] * p[i * 2 + 1];
  }
  return Math.abs(a) / 2;
}

function pointIn(p: number[], x: number, y: number): boolean {
  let inside = false;
  const n = p.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = p[i * 2];
    const yi = p[i * 2 + 1];
    const xj = p[j * 2];
    const yj = p[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

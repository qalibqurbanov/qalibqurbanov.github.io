import { glitchScreen, prefersReducedMotion } from "@/hooks/glitch";
import { glitchStorm } from "@/lib/effects";
import { shatter } from "@/lib/shatter";
import { isLightTheme } from "@/lib/themeMode";
import { clamp, easeOutCubic, rand } from "@/lib/math";

/** The "city demolition" behind the cyber butterfly (see CyberButterfly).
 *
 * The page's own elements are the buildings: the biggest blocks that are still
 * small enough to move as one piece (cards, text blocks, the terminal window,
 * the navbar…) become rigid bodies. They are moved with the individual CSS
 * transform properties (`translate`, `rotate`, `scale`), composed with whatever
 * the element already has, so nothing is rewritten, removed or re-rendered —
 * every inline value touched is remembered and put back on reboot.
 *
 * A canvas on top draws the rest: cracks that follow each body, TNT flashes,
 * sparks, dust, shockwaves and the debris chunks that pile up on the floor.
 * Bodies and debris both settle on one shared heightmap, so the rubble stacks.
 *
 * The whole document is the city: bodies live in page coordinates, the blast
 * front sweeps from the top of the page to the footer, the real scroll position
 * follows that front like a camera, and everything lands in one pile on the
 * page's real bottom edge.
 *
 * Sequence: activation pulse -> fracture -> top-to-bottom staggered collapse
 * (pancake, topple or blast) -> aftermath, until the user reboots. */

interface Origin {
  x: number;
  y: number;
}

interface Options {
  /** The system-down window's instruction (type a command). */
  hint: string;
  /** Text of the "click to reboot" hint used by the calmer variant. */
  hintAny: string;
}

type Mode = "collapse" | "topple" | "shatter";
type Phase = "intact" | "toppling" | "falling" | "landed" | "gone";

interface Crack {
  pts: Array<[number, number]>;
}

interface Body {
  el: HTMLElement;
  /** Centre and size at the start, in viewport px. */
  cx0: number;
  cy0: number;
  w: number;
  h: number;
  saved: Map<string, [string, string]>;
  baseT: [string, string];
  baseR: string;
  baseS: [string, string];
  mode: Mode;
  phase: Phase;
  trigger: number;
  crackStart: number;
  cracks: Crack[];
  notches: Array<{ edge: number; at: number; depth: number; spawned: boolean }>;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
  om: number;
  sx: number;
  sy: number;
  /** Fall distance and compression for the pancake collapse. */
  drop: number;
  dir: number;
  theta: number;
  restAngle: number;
  restY: number;
  hidden: boolean;
  /** Fixed or sticky: lives in the viewport until it lets go (then it is converted). */
  pinned: boolean;
  converted: boolean;
  /** Scroll position at the moment a pinned body was converted to page coordinates. */
  sd: number;
  /** Whether it was still transparent (an unrevealed block) when its cracks were due. */
  ghost: boolean | null;
  // reboot snapshot
  fx: number;
  fy: number;
  fa: number;
  fsx: number;
  fsy: number;
}

interface Chunk {
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
  om: number;
  pts: Array<[number, number]>;
  size: number;
  color: string;
  rest: boolean;
  glow: boolean;
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

interface Flash {
  x: number;
  y: number;
  r: number;
  life: number;
  max: number;
  color: string;
}

const TAU = Math.PI * 2;

const T_ACTIVATE = 650;
const T_FRACTURE = 1100;
const T_DEMO = T_ACTIVATE + T_FRACTURE;
const T_SPREAD = 3200;
const SWEEP_PX_PER_S = 620;
const CAM_LEAD = 0.4;
const T_REBOOT = 1100;
const AUTO_REBOOT_MS = 24000;
const BIN = 12;

const SAVED_PROPS = ["translate", "rotate", "scale", "transform-origin", "clip-path", "opacity", "visibility", "will-change"];

let running = false;

/** Runs the whole sequence; resolves once the page has been rebooted. */
export function demolish(origin: Origin, options: Options): Promise<void> {
  if (running) return Promise.resolve();
  running = true;
  const run = prefersReducedMotion()
    ? softDemolition(options)
    : // The page is shattered from a capture of itself; if that is not possible
      // here, the page's own blocks are moved instead.
      shatter(origin, options).catch((error) => {
        console.warn("Shard demolition unavailable, using the block fallback.", error);
        return new Demolition(origin, options).run();
      });
  return run.finally(() => {
    running = false;
  });
}

// --- Reduced motion --------------------------------------------------------

/** A calm alternative: the blocks dim, nothing flies or shakes. */
function softDemolition(options: Options): Promise<void> {
  const bodies = collect(window.innerWidth, window.innerHeight, 60, false);
  const root = document.getElementById("root");
  const hint = makeHint(options.hintAny);
  document.documentElement.classList.add("demolishing");
  if (root) root.inert = true;
  const saved = bodies.map((b) => ({ el: b.el, s: save(b.el) }));
  for (const { el } of saved) {
    el.classList.add("demolish-soft");
    el.style.opacity = "0.12";
  }
  requestAnimationFrame(() => hint.classList.add("is-shown"));

  return new Promise((resolve) => {
    const finish = () => {
      window.removeEventListener("pointerdown", onInput);
      window.removeEventListener("keydown", onInput);
      window.clearTimeout(timer);
      for (const { el, s } of saved) {
        el.style.opacity = s.get("opacity")?.[0] ?? "";
      }
      window.setTimeout(() => {
        for (const { el, s } of saved) {
          el.classList.remove("demolish-soft");
          restore(el, s);
        }
        document.documentElement.classList.remove("demolishing");
        if (root) root.inert = false;
        hint.remove();
        resolve();
      }, 700);
    };
    const onInput = () => finish();
    const timer = window.setTimeout(finish, 6000);
    window.setTimeout(() => {
      window.addEventListener("pointerdown", onInput);
      window.addEventListener("keydown", onInput);
    }, 600);
  });
}

// --- Collecting bodies -----------------------------------------------------

function save(el: HTMLElement): Map<string, [string, string]> {
  const map = new Map<string, [string, string]>();
  for (const p of SAVED_PROPS) map.set(p, [el.style.getPropertyValue(p), el.style.getPropertyPriority(p)]);
  return map;
}

function restore(el: HTMLElement, saved: Map<string, [string, string]>): void {
  for (const [prop, [value, priority]] of saved) {
    if (value) el.style.setProperty(prop, value, priority);
    else el.style.removeProperty(prop);
  }
  el.classList.remove("demolish-body");
}

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE", "CANVAS", "SOURCE", "TRACK"]);

function colorOf(el: HTMLElement): string {
  const cs = getComputedStyle(el);
  const alpha = (c: string) => {
    const m = /rgba?\(([^)]+)\)/.exec(c);
    if (!m) return 0;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    return parts.length > 3 ? parseFloat(parts[3]) : 1;
  };
  if (alpha(cs.backgroundColor) > 0.25) return cs.backgroundColor;
  if (alpha(cs.borderTopColor) > 0.25 && parseFloat(cs.borderTopWidth) > 0) return cs.borderTopColor;
  return cs.color;
}

/** The blocks that will fall: the topmost elements that are still small
 * enough to move as one piece. Large containers are walked through. */
function collect(W: number, H: number, cap: number, whole: boolean): Body[] {
  const root = document.getElementById("root");
  if (!root) return [];
  const maxArea = W * H * 0.28;
  const scrollY = window.scrollY;
  const out: Body[] = [];

  const walk = (el: HTMLElement, depth: number, pinned: boolean) => {
    if (SKIP_TAGS.has(el.tagName) || el.hasAttribute("data-demolish-keep")) return;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    const r = el.getBoundingClientRect();
    const here = pinned || cs.position === "fixed" || cs.position === "sticky";
    // Scroll-reveal blocks below the fold are still transparent: they are part of the page.
    if (parseFloat(cs.opacity) === 0 && !(whole && !here && r.top > H)) return;
    // Decorative fixed layers (ambient background, cursor, glow) stay: they are
    // the "residual neon" of the aftermath.
    if (cs.position === "fixed" && cs.pointerEvents === "none") return;
    // Purely decorative pieces (blurred blobs, glows) are not buildings: they stay.
    if (el.getAttribute("aria-hidden") === "true") return;
    if (cs.pointerEvents === "none" && !el.textContent?.trim() && !el.querySelector("img, svg, video, canvas")) return;

    if (r.width < 6 || r.height < 6) return;
    if (r.right < 0 || r.left > W) return;
    if ((!whole || here) && (r.bottom < 0 || r.top > H)) return;

    const big = r.width * r.height > maxArea || r.height > H * 0.58 || r.width > W * 0.97;
    const hasKids = el.children.length > 0;
    if ((big || (depth < 1 && hasKids && r.height > H * 0.4)) && hasKids) {
      for (const child of Array.from(el.children)) if (child instanceof HTMLElement || child instanceof SVGElement) walk(child as HTMLElement, depth + 1, here);
      return;
    }
    out.push(makeBody(el, r, cs, W, H, here, scrollY));
  };

  for (const child of Array.from(root.children)) if (child instanceof HTMLElement) walk(child, 0, false);
  // Biggest blocks first when there are too many to simulate.
  if (out.length > cap) {
    out.sort((a, b) => b.w * b.h - a.w * a.h);
    out.length = cap;
  }
  return out;
}

function makeBody(el: HTMLElement, r: DOMRect, cs: CSSStyleDeclaration, W: number, H: number, pinned: boolean, scrollY: number): Body {
  const parts = (v: string, n: number, fallback: string) => {
    if (!v || v === "none") return Array<string>(n).fill(fallback);
    const p = v.split(/\s+/);
    return Array.from({ length: n }, (_, i) => p[i] ?? (n === 2 && i === 1 ? p[0] : fallback));
  };
  const t = parts(cs.translate, 2, "0px");
  const s = parts(cs.scale, 2, "1");
  const rot = /^-?[\d.]+deg$/.test(cs.rotate) ? cs.rotate : "0deg";
  const area = r.width * r.height;
  const tall = r.height > r.width * 0.7;
  const roll = Math.random();
  let mode: Mode;
  if (area > W * H * 0.06 && roll < 0.6) mode = "collapse";
  else if (tall && roll < 0.85) mode = "topple";
  else if (roll < 0.25) mode = "topple";
  else mode = "shatter";
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2 + (pinned ? 0 : scrollY);
  return {
    el,
    cx0: cx,
    cy0: cy,
    w: r.width,
    h: r.height,
    saved: save(el),
    baseT: [t[0], t[1]],
    baseR: rot,
    baseS: [s[0], s[1]],
    mode,
    phase: "intact",
    trigger: 0,
    crackStart: 0,
    cracks: [],
    notches: [],
    color: colorOf(el),
    x: cx,
    y: cy,
    vx: 0,
    vy: 0,
    a: 0,
    om: 0,
    sx: 1,
    sy: 1,
    drop: 0,
    dir: 1,
    theta: 0,
    restAngle: 0,
    restY: 0,
    hidden: false,
    pinned,
    converted: false,
    sd: 0,
    ghost: null,
    fx: 0,
    fy: 0,
    fa: 0,
    fsx: 1,
    fsy: 1,
  };
}

function makeHint(text: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "demolition-hint";
  el.setAttribute("role", "status");
  el.textContent = text;
  document.body.appendChild(el);
  return el;
}

// --- The simulation --------------------------------------------------------

class Demolition {
  private readonly W = window.innerWidth;
  private readonly H = window.innerHeight;
  private readonly mobile = this.W < 700;
  private readonly scroll0 = window.scrollY;
  private readonly Hd = Math.max(document.documentElement.scrollHeight, window.innerHeight);
  private readonly capH = window.innerHeight * 0.32;
  private readonly g = 2300 * Math.max(0.7, Math.min(1.3, this.H / 900));
  private readonly canvas = document.createElement("canvas");
  private readonly ctx: CanvasRenderingContext2D;
  private readonly bodies: Body[];
  private readonly chunks: Chunk[] = [];
  private readonly puffs: Puff[] = [];
  private readonly sparks: Spark[] = [];
  private readonly rings: Ring[] = [];
  private readonly flashes: Flash[] = [];
  private readonly heights: Float32Array;
  private readonly puffSprite: HTMLCanvasElement;
  private readonly warmSprite: HTMLCanvasElement;
  private readonly accent: string;
  private readonly accent2: string;
  private readonly warm: string;
  private readonly maxChunks: number;
  private readonly maxPuffs: number;
  private readonly root = document.getElementById("root");
  /** The camera (scroll position) and the lowest point the blast has reached. */
  private sy = window.scrollY;
  private front = 0;
  private detonated = 0;
  private demoAt = T_DEMO;
  private tMax = 0;
  private camReboot = 0;
  private clock = 0;
  private last = 0;
  private raf = 0;
  private impulse = 0;
  private shakeX = 0;
  private shakeY = 0;
  private stage: "run" | "after" | "reboot" = "run";
  private rebootAt = 0;
  private activated = false;
  private pulsed = false;
  private resolve: () => void = () => {};
  private cleanup: Array<() => void> = [];
  private cleanupFinal: Array<() => void> = [];

  private readonly origin: Origin;

  constructor(origin: Origin, _options: Options) {
    // The click is in viewport px; the simulation lives in page px.
    this.origin = { x: origin.x, y: origin.y + this.scroll0 };
    const dpr = this.mobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.className = "demolition-canvas";
    this.canvas.width = Math.round(this.W * dpr);
    this.canvas.height = Math.round(this.H * dpr);
    this.canvas.setAttribute("aria-hidden", "true");
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("2d canvas unavailable");
    this.ctx = ctx;
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(document.documentElement);
    this.accent = css.getPropertyValue("--color-accent").trim() || "#b185ff";
    this.accent2 = css.getPropertyValue("--color-accent-2").trim() || "#d8b4fe";
    this.warm = css.getPropertyValue("--color-syn-type").trim() || "#f0abfc";
    this.maxChunks = this.mobile ? 200 : 460;
    this.maxPuffs = this.mobile ? 70 : 150;
    this.heights = new Float32Array(Math.ceil(this.W / BIN) + 2);
    this.puffSprite = this.sprite("rgba(150,140,175,1)", "rgba(60,52,90,0)");
    this.warmSprite = this.sprite("rgba(245,200,255,1)", "rgba(200,100,255,0)");
    this.bodies = collect(this.W, this.H, this.mobile ? 130 : 260, true);
  }

  run(): Promise<void> {
    document.documentElement.classList.add("demolishing");
    if (this.root) this.root.inert = true;
    document.body.appendChild(this.canvas);
    this.unclip();
    for (const b of this.bodies) {
      b.el.classList.add("demolish-body");
      b.el.style.transformOrigin = "50% 50%";
    }
    this.plan();

    // Only a real change of width ends it: mobile browsers also fire `resize`
    // whenever the address bar slides in or out.
    const onResize = () => {
      if (Math.abs(window.innerWidth - this.W) > 2) this.beginReboot();
    };
    window.addEventListener("resize", onResize);
    this.cleanup.push(() => window.removeEventListener("resize", onResize));

    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  /** Falling blocks must not be cut off by an ancestor's `overflow: hidden`. */
  private unclip(): void {
    const seen = new Set<HTMLElement>();
    for (const b of this.bodies) {
      for (let el = b.el.parentElement; el && el !== this.root; el = el.parentElement) {
        if (seen.has(el)) break;
        seen.add(el);
        const cs = getComputedStyle(el);
        if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
        const prev: [string, string] = [el.style.getPropertyValue("overflow"), el.style.getPropertyPriority("overflow")];
        el.style.setProperty("overflow", "visible", "important");
        this.cleanupFinal.push(() => {
          if (prev[0]) el.style.setProperty("overflow", prev[0], prev[1]);
          else el.style.removeProperty("overflow");
        });
      }
    }
  }

  /** Decides each body's timing and fate. */
  private plan(): void {
    // A page scrolled down first has to travel back to the top.
    const lead = clamp(this.scroll0 * 0.25, 0, 1000);
    this.demoAt = T_DEMO + lead;
    // The blast front advances at a steady pace down the real height of the page.
    const sweep = clamp((this.Hd / SWEEP_PX_PER_S) * 1000, T_SPREAD, 16000);
    this.tMax = this.demoAt + sweep + 8000;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const b of this.bodies) {
      const key = b.pinned ? 0 : b.cy0;
      minY = Math.min(minY, key);
      maxY = Math.max(maxY, key);
    }
    const span = Math.max(1, maxY - minY);
    for (const b of this.bodies) {
      const progress = ((b.pinned ? 0 : b.cy0) - minY) / span;
      // Strictly top to bottom, with a little left-to-right ripple inside a row.
      b.trigger = this.demoAt + progress * sweep + (b.cx0 / this.W) * 140 + rand(0, 200);
      b.crackStart = clamp(b.trigger - 1100 - rand(0, 150), T_ACTIVATE + rand(0, 120), b.trigger);
      b.dir = b.cx0 < this.origin.x ? -1 : 1;
      if (Math.abs(b.cx0 - this.origin.x) < this.W * 0.06) b.dir = Math.random() < 0.5 ? -1 : 1;
      this.makeCracks(b);
    }
  }

  private makeCracks(b: Body): void {
    const count = clamp(Math.round((b.w * b.h) / 26000) + 2, 2, 6);
    for (let i = 0; i < count; i++) {
      // Start on an edge and grow inward in a jagged, branching line.
      const edge = Math.floor(Math.random() * 4);
      let x = edge === 0 ? rand(-b.w / 2, b.w / 2) : edge === 1 ? b.w / 2 : edge === 2 ? rand(-b.w / 2, b.w / 2) : -b.w / 2;
      let y = edge === 0 ? -b.h / 2 : edge === 1 ? rand(-b.h / 2, b.h / 2) : edge === 2 ? b.h / 2 : rand(-b.h / 2, b.h / 2);
      let ang = Math.atan2(-y, -x) + rand(-0.7, 0.7);
      const pts: Array<[number, number]> = [[x, y]];
      const segs = Math.round(rand(5, 11));
      const len = Math.min(b.w, b.h) * 0.16 + 8;
      for (let s = 0; s < segs; s++) {
        ang += rand(-0.7, 0.7);
        x += Math.cos(ang) * len * rand(0.5, 1.1);
        y += Math.sin(ang) * len * rand(0.5, 1.1);
        if (Math.abs(x) > b.w / 2 + 4 || Math.abs(y) > b.h / 2 + 4) break;
        pts.push([x, y]);
      }
      b.cracks.push({ pts });
    }
    const notchCount = clamp(Math.round((b.w + b.h) / 90), 2, 7);
    for (let i = 0; i < notchCount; i++) {
      b.notches.push({ edge: Math.floor(Math.random() * 4), at: rand(0.1, 0.9), depth: rand(0.35, 1), spawned: false });
    }
  }

  // --- Frame loop ---

  private frame = (now: number) => {
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    // Simulation time, so a stuttering frame rate slows the show instead of skipping through it.
    this.clock += dt * 1000;
    const t = this.clock;

    if (this.stage === "reboot") this.updateReboot(now);
    else this.update(dt, t);
    this.draw(dt);

    if (this.stage === "reboot" && now - this.rebootAt > T_REBOOT + 60) {
      this.finish();
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private update(dt: number, t: number): void {
    // Activation: the energy pulse leaves the butterfly and the UI glitches.
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
      this.flashes.push({ x: this.origin.x, y: this.origin.y, r: 160, life: 0.5, max: 0.5, color: "255,255,255" });
      this.burstSparks(this.origin.x, this.origin.y, this.mobile ? 40 : 90, 700);
      this.impulse += 9;
      glitchScreen();
    }

    // Camera shake: builds through the fracture, spikes on every impact.
    const ramp = t < T_ACTIVATE ? 0 : t < T_DEMO ? ((t - T_ACTIVATE) / T_FRACTURE) * 3 : this.stage === "run" ? 2 : 0.4;
    this.impulse *= Math.exp(-5 * dt);
    const amp = Math.min(22, ramp + this.impulse);
    this.shakeX = (Math.random() - 0.5) * 2 * amp;
    this.shakeY = (Math.random() - 0.5) * 2 * amp;

    this.moveCamera(dt, t);

    let busy = false;
    for (const b of this.bodies) {
      this.updateBody(b, dt, t);
      if (b.phase !== "landed" && b.phase !== "gone") busy = true;
      this.apply(b);
    }

    this.updateParticles(dt);

    if (this.stage === "run" && ((!busy && t > this.demoAt) || t > this.tMax)) {
      this.stage = "after";
      for (const b of this.bodies) {
        if (b.phase !== "landed" && b.phase !== "gone") this.forceLand(b);
      }
      const arm = window.setTimeout(() => {
        window.addEventListener("pointerdown", this.onInput);
        window.addEventListener("keydown", this.onInput);
      }, 1500);
      const auto = window.setTimeout(() => this.beginReboot(), AUTO_REBOOT_MS);
      this.cleanup.push(() => {
        window.clearTimeout(arm);
        window.clearTimeout(auto);
        window.removeEventListener("pointerdown", this.onInput);
        window.removeEventListener("keydown", this.onInput);
      });
    }

    if (this.stage === "after") this.aftermath(dt, t);
  }

  private onInput = () => this.beginReboot();

  // --- Camera ---

  /** The scroll position follows the blast front down the page, then settles on the bottom. */
  private moveCamera(dt: number, t: number): void {
    const max = Math.max(0, this.Hd - this.H);
    let target: number;
    if (t < this.demoAt) target = 0;
    else if (this.stage !== "run" || this.detonated >= this.bodies.length) target = max;
    else target = clamp(this.front - this.H * CAM_LEAD, 0, max);
    const k = t < this.demoAt ? 6 : 3.2;
    const step = (target - this.sy) * (1 - Math.exp(-k * dt));
    const cap = 3200 * dt;
    this.scrollTo(this.sy + clamp(step, -cap, cap));
  }

  private scrollTo(y: number): void {
    window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
    // What the browser really did (rounding, clamping) is what everything is drawn against.
    this.sy = window.scrollY;
  }

  /** Pinned bodies that have not let go yet are drawn where the viewport holds them. */
  private off(b: Body): number {
    return b.pinned && !b.converted ? this.sy : 0;
  }

  // --- Bodies ---

  private updateBody(b: Body, dt: number, t: number): void {
    if (b.phase === "intact") {
      this.fracture(b, t);
      if (t >= b.trigger) this.detonate(b);
      return;
    }

    if (b.phase === "toppling") {
      b.om += (2.4 + 9 * Math.sin(Math.min(b.theta, 1.4))) * dt;
      b.theta += b.om * dt;
      b.a = b.dir * b.theta;
      const px = b.cx0 + b.dir * (b.w / 2);
      const py = b.cy0 + b.h / 2;
      const rx = -b.dir * (b.w / 2);
      const ry = -b.h / 2;
      b.x = px + rx * Math.cos(b.a) - ry * Math.sin(b.a);
      b.y = py + rx * Math.sin(b.a) + ry * Math.cos(b.a);
      if (b.theta > 0.95) {
        // Let go: continue as a free body with the speed of the swing.
        const cx = b.x - px;
        const cy = b.y - py;
        b.vx = -b.dir * b.om * cy;
        b.vy = b.dir * b.om * cx;
        b.om = b.dir * b.om;
        b.phase = "falling";
      }
      return;
    }

    if (b.phase === "falling") {
      if (b.mode === "collapse") this.stepPancake(b, dt);
      else this.stepFree(b, dt);
      return;
    }

    if (b.phase === "landed" && b.mode !== "collapse") {
      // Settle onto its resting angle and height after the last bounce.
      const k = Math.min(1, dt * 7);
      b.a += (b.restAngle - b.a) * k;
      b.y += (b.restY - b.y) * k;
    }
  }

  private fracture(b: Body, t: number): void {
    const p = clamp((t - b.crackStart) / 760, 0, 1);
    if (p <= 0) return;
    if (b.ghost === null) {
      b.ghost = parseFloat(getComputedStyle(b.el).opacity) < 0.05;
      if (!b.ghost) b.el.style.willChange = "translate, rotate, scale";
    }
    if (b.ghost) return;
    // Rumble, and the edges crumble: polygon notches grow, chips fall off.
    const j = p * 1.6;
    b.x = b.cx0 + (Math.random() - 0.5) * j;
    b.y = b.cy0 + (Math.random() - 0.5) * j;
    const poly = this.crumblePoly(b, p);
    b.el.style.clipPath = poly;
    for (const n of b.notches) {
      if (!n.spawned && p > 0.35 + n.depth * 0.45) {
        n.spawned = true;
        const [x, ey] = this.edgePoint(b, n.edge, n.at);
        const y = ey + this.off(b);
        this.spawnChunks(x, y, 1 + Math.round(rand(0, 2)), b.color, 60, false);
        this.dust(x, y, 1, 14, false);
      }
    }
  }

  private edgePoint(b: Body, edge: number, at: number): [number, number] {
    const l = b.cx0 - b.w / 2;
    const r = b.cx0 + b.w / 2;
    const tp = b.cy0 - b.h / 2;
    const bt = b.cy0 + b.h / 2;
    if (edge === 0) return [l + b.w * at, tp];
    if (edge === 1) return [r, tp + b.h * at];
    if (edge === 2) return [l + b.w * at, bt];
    return [l, tp + b.h * at];
  }

  /** A rectangle whose edges have bites taken out of them, as a clip-path. */
  private crumblePoly(b: Body, p: number): string {
    const w = b.w;
    const h = b.h;
    const size = Math.min(w, h) * 0.13 * p;
    const pts: Array<[number, number]> = [];
    const edge = (id: number) =>
      b.notches
        .filter((n) => n.edge === id)
        .sort((m, n) => (id < 2 ? m.at - n.at : n.at - m.at));
    const add = (x: number, y: number) => pts.push([x, y]);
    add(0, 0);
    for (const n of edge(0)) {
      const x = w * n.at;
      add(x - size * 0.8, 0);
      add(x, size * n.depth * 1.3);
      add(x + size * 0.8, 0);
    }
    add(w, 0);
    for (const n of edge(1)) {
      const y = h * n.at;
      add(w, y - size * 0.8);
      add(w - size * n.depth * 1.3, y);
      add(w, y + size * 0.8);
    }
    add(w, h);
    for (const n of edge(2)) {
      const x = w * n.at;
      add(x + size * 0.8, h);
      add(x, h - size * n.depth * 1.3);
      add(x - size * 0.8, h);
    }
    add(0, h);
    for (const n of edge(3)) {
      const y = h * n.at;
      add(0, y + size * 0.8);
      add(size * n.depth * 1.3, y);
      add(0, y - size * 0.8);
    }
    return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",")})`;
  }

  /** The charge goes off: flash, sparks, and the body starts to move. */
  private detonate(b: Body): void {
    this.detonated++;
    if (b.pinned) {
      // Let go of the viewport: from here on it lives in page coordinates.
      b.cy0 += this.sy;
      b.sd = this.sy;
      b.converted = true;
      b.x = b.cx0;
      b.y = b.cy0;
    }
    this.front = Math.max(this.front, b.cy0 + b.h / 2);
    if (b.ghost || (b.ghost === null && parseFloat(getComputedStyle(b.el).opacity) < 0.05)) {
      // Never revealed: nothing to see, so nothing to blow up.
      b.phase = "gone";
      b.hidden = true;
      b.el.style.visibility = "hidden";
      return;
    }
    b.el.style.willChange = "translate, rotate, scale";
    const baseY = b.cy0 + b.h / 2;
    for (const side of [-1, 1]) {
      const x = b.cx0 + side * b.w * 0.38;
      this.flashes.push({ x, y: baseY, r: 40 + Math.min(50, b.w * 0.12), life: 0.3, max: 0.3, color: "255,235,190" });
      this.burstSparks(x, baseY, this.mobile ? 8 : 16, 520);
    }
    this.addRing(b.cx0, baseY, 8, 50 + b.w * 0.1, 0.4, 1.6, this.warm);
    this.dust(b.cx0, baseY, 2, 16, true);
    this.impulse += 5;

    if (b.mode === "collapse") {
      b.phase = "falling";
      b.vy = 0;
      b.vx = rand(-12, 12);
      b.om = rand(-0.05, 0.05);
    } else if (b.mode === "topple") {
      b.phase = "toppling";
      b.theta = 0;
      b.om = 0.35;
    } else {
      b.phase = "falling";
      const dx = b.cx0 - this.origin.x;
      const dy = b.cy0 - this.origin.y;
      const d = Math.hypot(dx, dy) || 1;
      const power = rand(260, 700) * (1.1 - Math.min(1, d / Math.hypot(this.W, this.H)) * 0.6);
      b.vx = (dx / d) * power;
      b.vy = (dy / d) * power * 0.5 - rand(180, 520);
      b.om = rand(-2.6, 2.6) / (1 + (b.w * b.h) / 90000);
    }
  }

  private halfExtents(b: Body): [number, number] {
    const c = Math.abs(Math.cos(b.a));
    const s = Math.abs(Math.sin(b.a));
    const w = b.w * b.sx;
    const h = b.h * b.sy;
    return [(c * w + s * h) / 2, (s * w + c * h) / 2];
  }

  private stepPancake(b: Body, dt: number): void {
    b.vy = Math.min(b.vy + this.g * dt, 2600);
    b.drop += b.vy * dt;
    b.sy = Math.max(0.2, b.sy - dt * 1.5);
    b.sx = 1 + (1 - b.sy) * 0.1;
    b.x = b.cx0 + Math.sin(b.drop * 0.05) * 3;
    const bottom = b.cy0 + b.h / 2 + b.drop;
    b.y = bottom - (b.h * b.sy) / 2;
    b.a = Math.sin(b.drop * 0.02) * 0.02;
    const floor = this.floorAt(b.x - b.w / 2, b.x + b.w / 2);
    if (bottom >= floor) {
      b.drop = floor - (b.cy0 + b.h / 2);
      b.y = floor - (b.h * b.sy) / 2;
      this.impact(b, b.vy, true);
      this.raise(b.x - b.w / 2, b.x + b.w / 2, floor - Math.min(7, b.h * 0.05));
      b.hidden = true;
      b.phase = "gone";
      b.el.style.visibility = "hidden";
    }
  }

  private stepFree(b: Body, dt: number): void {
    b.vy = Math.min(b.vy + this.g * dt, 2600);
    b.vx *= 1 - 0.12 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.a += b.om * dt;
    const [hw, hh] = this.halfExtents(b);
    if (b.x - hw < 0) {
      b.x = hw;
      b.vx = Math.abs(b.vx) * 0.45;
    } else if (b.x + hw > this.W) {
      b.x = this.W - hw;
      b.vx = -Math.abs(b.vx) * 0.45;
    }
    const floor = this.floorAt(b.x - hw, b.x + hw);
    if (b.y + hh >= floor) {
      b.y = floor - hh;
      const speed = b.vy;
      if (this.floorHeight(b.x - hw, b.x + hw) >= this.capAt(clamp(Math.floor(b.x / BIN), 0, this.heights.length - 1)) * 0.94) {
        // The pile is full here: the block crumbles into it instead of hovering on top.
        this.impact(b, Math.max(speed, 300), true);
        b.phase = "gone";
        b.hidden = true;
        b.el.style.visibility = "hidden";
        return;
      }
      if (speed > 170) this.impact(b, speed, false);
      b.vy = -speed * 0.2;
      b.vx *= 0.6;
      b.om *= 0.45;
      if (Math.abs(b.vy) < 70) {
        b.vy = 0;
        b.om = 0;
        b.phase = "landed";
        this.settle(b);
      }
    }
  }

  private forceLand(b: Body): void {
    if (b.mode === "collapse") {
      b.phase = "gone";
      b.hidden = true;
      b.el.style.visibility = "hidden";
      return;
    }
    b.phase = "landed";
    this.settle(b);
  }

  /** Picks how the body lies in the rubble: wide blocks flat, tall ones mostly on their side. */
  private settle(b: Body): void {
    const flat = b.w >= b.h * 0.9;
    const side = Math.random() < 0.5 ? -1 : 1;
    b.restAngle = flat ? rand(-0.18, 0.18) : Math.random() < 0.7 ? side * (Math.PI / 2) + rand(-0.12, 0.12) : rand(-0.35, 0.35);
    // Take the short way round to it.
    const d = b.a - b.restAngle;
    b.a = b.restAngle + Math.atan2(Math.sin(d), Math.cos(d));
    const c = Math.abs(Math.cos(b.restAngle));
    const s = Math.abs(Math.sin(b.restAngle));
    const hw = (c * b.w * b.sx + s * b.h * b.sy) / 2;
    const hh = (s * b.w * b.sx + c * b.h * b.sy) / 2;
    const floor = this.floorAt(b.x - hw, b.x + hw);
    b.restY = floor - hh;
    this.raise(b.x - hw, b.x + hw, b.restY - hh);
  }

  /** A hard landing: debris, dust, a ring and a jolt. */
  private impact(b: Body, speed: number, big: boolean): void {
    const x = b.x;
    const y = this.floorAt(b.x - b.w / 2, b.x + b.w / 2);
    const area = b.w * b.h;
    this.spawnChunks(x, y - 6, clamp(Math.round(area / (big ? 5200 : 9000)), 2, big ? 14 : 6), b.color, 120 + speed * 0.25, true);
    this.dust(x, y - 4, big ? 6 : 3, clamp(b.w * 0.14, 22, 64), false);
    this.addRing(x, y, 8, clamp(b.w * 0.6, 60, 240), 0.55, 2, "rgba(210,200,240,1)");
    this.burstSparks(x, y - 6, this.mobile ? 6 : 12, 420);
    this.impulse += clamp(speed / 160, 1.5, big ? 9 : 5);
  }

  private apply(b: Body): void {
    if (b.phase === "intact") {
      if (b.x !== b.cx0 || b.y !== b.cy0) {
        b.el.style.translate = this.tr(b.baseT, b.x - b.cx0 + this.shakeX * 0.4, b.y - b.cy0 + this.shakeY * 0.4);
      }
      return;
    }
    if (b.hidden) return;
    const dx = b.x - b.cx0 + this.shakeX;
    const dy = b.y - b.cy0 + this.shakeY + (b.pinned ? b.sd - this.sy : 0);
    b.el.style.translate = this.tr(b.baseT, dx, dy);
    b.el.style.rotate = b.baseR === "0deg" ? `${b.a}rad` : `calc(${b.baseR} + ${b.a}rad)`;
    b.el.style.scale = `calc(${b.baseS[0]} * ${b.sx.toFixed(3)}) calc(${b.baseS[1]} * ${b.sy.toFixed(3)})`;
  }

  private tr(base: [string, string], dx: number, dy: number): string {
    const part = (b: string, d: number) => (b === "0px" ? `${d.toFixed(2)}px` : `calc(${b} + ${d.toFixed(2)}px)`);
    return `${part(base[0], dx)} ${part(base[1], dy)}`;
  }

  // --- Floor ---

  private floorAt(x0: number, x1: number): number {
    const i0 = clamp(Math.floor(x0 / BIN), 0, this.heights.length - 1);
    const i1 = clamp(Math.floor(x1 / BIN), 0, this.heights.length - 1);
    let top = 0;
    for (let i = i0; i <= i1; i++) top = Math.max(top, this.heights[i]);
    return this.Hd - top;
  }

  /** Ceiling of the pile at a column: a ridge line, so the rubble is never flat. */
  private capAt(i: number): number {
    const n = Math.sin(i * 0.19) * 0.5 + Math.sin(i * 0.071 + 1.7) * 0.35 + Math.sin(i * 0.43) * 0.15;
    return this.capH * (0.72 + 0.28 * n);
  }

  private floorHeight(x0: number, x1: number): number {
    return this.Hd - this.floorAt(x0, x1);
  }

  private raise(x0: number, x1: number, topY: number): void {
    const i0 = clamp(Math.floor(x0 / BIN), 0, this.heights.length - 1);
    const i1 = clamp(Math.floor(x1 / BIN), 0, this.heights.length - 1);
    const level = this.Hd - topY;
    for (let i = i0; i <= i1; i++) {
      const h = this.heights[i];
      // Climbs towards the new top in steps, never past this column's own ceiling.
      if (level > h) this.heights[i] = Math.min(h + (level - h) * 0.7, this.capAt(i));
    }
  }

  // --- Particles ---

  private addRing(x: number, y: number, r: number, to: number, life: number, width: number, color: string): void {
    this.rings.push({ x, y, r, speed: (to - r) / life, life, max: life, width, color });
  }

  private burstSparks(x: number, y: number, n: number, speed: number): void {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const s = rand(speed * 0.25, speed);
      const life = rand(0.3, 0.9);
      const palette = [this.warm, this.warm, this.accent2, this.accent, "#ffffff"];
      this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.2, life, max: life, color: palette[Math.floor(Math.random() * palette.length)], grav: 1100 });
    }
  }

  private dust(x: number, y: number, n: number, r: number, warm: boolean): void {
    for (let i = 0; i < n && this.puffs.length < this.maxPuffs; i++) {
      const life = warm ? rand(0.5, 1.1) : rand(1.1, 2.6);
      this.puffs.push({
        x: x + rand(-r, r),
        y: y + rand(-r * 0.3, r * 0.3),
        vx: rand(-40, 40),
        vy: rand(-55, -8),
        r: r * rand(0.5, 1),
        grow: warm ? rand(8, 20) : rand(18, 46),
        life,
        max: life,
        alpha: warm ? rand(0.1, 0.2) : rand(0.22, 0.42),
        warm,
      });
    }
  }

  private spawnChunks(x: number, y: number, n: number, color: string, speed: number, up: boolean): void {
    for (let i = 0; i < n && this.chunks.length < this.maxChunks; i++) {
      const size = rand(4, 15);
      const sides = Math.random() < 0.5 ? 3 : 4;
      const pts: Array<[number, number]> = [];
      for (let k = 0; k < sides; k++) {
        const a = (k / sides) * TAU + rand(-0.4, 0.4);
        pts.push([Math.cos(a) * size * rand(0.5, 1), Math.sin(a) * size * rand(0.5, 1)]);
      }
      const a = rand(-Math.PI, 0);
      const glow = Math.random() < 0.22;
      this.chunks.push({
        x: x + rand(-8, 8),
        y,
        vx: Math.cos(a) * rand(0.2, 1) * speed * 1.6,
        vy: (up ? Math.sin(a) : Math.sin(a) * 0.3) * rand(0.4, 1) * speed * 2.2,
        a: rand(0, TAU),
        om: rand(-9, 9),
        pts,
        size,
        color: glow ? (Math.random() < 0.5 ? this.accent : this.accent2) : color,
        rest: false,
        glow,
      });
    }
  }

  private updateParticles(dt: number): void {
    for (const c of this.chunks) {
      if (c.rest) continue;
      c.vy += this.g * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.a += c.om * dt;
      if (c.x < 0 || c.x > this.W) {
        c.x = clamp(c.x, 0, this.W);
        c.vx *= -0.4;
      }
      const floor = this.floorAt(c.x - 2, c.x + 2) - c.size * 0.4;
      if (c.y >= floor) {
        c.y = floor;
        if (c.vy > 120) {
          c.vy *= -0.3;
          c.vx *= 0.6;
          c.om *= 0.5;
        } else {
          c.rest = true;
          c.om = 0;
          const i = clamp(Math.floor(c.x / BIN), 0, this.heights.length - 1);
          this.heights[i] = Math.min(this.capAt(i), this.heights[i] + c.size * 0.08);
        }
      }
    }
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
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      this.flashes[i].life -= dt;
      if (this.flashes[i].life <= 0) this.flashes.splice(i, 1);
    }
  }

  // --- Aftermath ---

  private aftermath(dt: number, t: number): void {
    // Smoke drifting up from the rubble and neon embers floating over it.
    if (Math.random() < dt * 5 && this.puffs.length < this.maxPuffs) {
      const x = rand(0, this.W);
      this.dust(x, this.floorAt(x - 10, x + 10), 1, 30, false);
    }
    if (Math.random() < dt * 9) {
      const x = rand(0, this.W);
      const y = this.floorAt(x - 10, x + 10);
      this.sparks.push({
        x,
        y,
        vx: rand(-20, 20),
        vy: rand(-140, -40),
        life: rand(1.2, 2.8),
        max: 2.8,
        color: Math.random() < 0.5 ? this.accent : this.accent2,
        grav: -12,
      });
    }
    void t;
  }

  // --- Reboot ---

  private beginReboot(): void {
    if (this.stage === "reboot") return;
    this.stage = "reboot";
    this.rebootAt = performance.now();
    for (const fn of this.cleanup.splice(0)) fn();
    glitchScreen();
    glitchStorm(900);
    this.camReboot = this.sy;
    for (const b of this.bodies) {
      b.fx = b.x - b.cx0;
      b.fy = b.y - b.cy0 + (b.pinned && b.converted ? b.sd - this.sy : 0);
      b.fa = b.a;
      b.fsx = b.sx;
      b.fsy = b.sy;
      b.el.style.clipPath = "";
      if (b.hidden) {
        b.el.style.visibility = "";
        b.el.style.opacity = "0";
      }
    }
  }

  private updateReboot(now: number): void {
    const p = easeOutCubic((now - this.rebootAt) / T_REBOOT);
    this.shakeX = this.shakeY = 0;
    // The camera travels back to where the visitor was.
    this.scrollTo(this.camReboot + (this.scroll0 - this.camReboot) * p);
    for (const b of this.bodies) {
      const dx = b.fx * (1 - p);
      const dy = b.fy * (1 - p);
      const a = b.fa * (1 - p);
      const sx = b.fsx + (1 - b.fsx) * p;
      const sy = b.fsy + (1 - b.fsy) * p;
      b.el.style.translate = this.tr(b.baseT, dx, dy);
      b.el.style.rotate = b.baseR === "0deg" ? `${a}rad` : `calc(${b.baseR} + ${a}rad)`;
      b.el.style.scale = `calc(${b.baseS[0]} * ${sx.toFixed(3)}) calc(${b.baseS[1]} * ${sy.toFixed(3)})`;
      if (b.hidden) b.el.style.opacity = String(p);
    }
    // Debris dissolves as the page reassembles.
    this.updateParticles(0.016);
    const fade = 1 - p;
    this.canvas.style.opacity = String(fade);
  }

  private finish(): void {
    cancelAnimationFrame(this.raf);
    for (const fn of this.cleanup.splice(0)) fn();
    for (const b of this.bodies) restore(b.el, b.saved);
    for (const fn of this.cleanupFinal.splice(0)) fn();
    this.scrollTo(this.scroll0);
    this.canvas.remove();
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

  private draw(dt: number): void {
    void dt;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.save();
    ctx.translate(this.shakeX * 0.5, this.shakeY * 0.5 - this.sy);

    this.drawRubble(ctx);

    this.drawCracks(ctx);
    this.drawPuffs(ctx, false);

    const top = this.sy - 60;
    const bottom = this.sy + this.H + 60;
    for (const c of this.chunks) {
      if (c.y < top || c.y > bottom) continue;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.a);
      ctx.fillStyle = c.color;
      if (c.glow) {
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.moveTo(c.pts[0][0], c.pts[0][1]);
      for (let i = 1; i < c.pts.length; i++) ctx.lineTo(c.pts[i][0], c.pts[i][1]);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.globalCompositeOperation = "lighter";
    for (const f of this.flashes) {
      const k = f.life / f.max;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * (1.4 - k * 0.4));
      g.addColorStop(0, `rgba(${f.color},${(0.6 * k).toFixed(3)})`);
      g.addColorStop(1, `rgba(${f.color},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(f.x - f.r * 1.4, f.y - f.r * 1.4, f.r * 2.8, f.r * 2.8);
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
    for (const r of this.rings) {
      const k = r.life / r.max;
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = clamp(k, 0, 1) * 0.9;
      ctx.lineWidth = r.width * (0.4 + k);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    this.drawPuffs(ctx, true);
    ctx.restore();
  }

  private drawPuffs(ctx: CanvasRenderingContext2D, warm: boolean): void {
    for (const p of this.puffs) {
      if (p.warm !== warm && warm) continue;
      if (!warm && p.warm) continue;
      const k = p.life / p.max;
      ctx.globalAlpha = p.alpha * Math.min(1, k * 2);
      const sprite = p.warm ? this.warmSprite : this.puffSprite;
      ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalAlpha = 1;
  }

  /** The pile as a dim, jagged mass with a neon edge: what the heightmap
   * the debris and blocks settle on actually looks like. */
  private drawRubble(ctx: CanvasRenderingContext2D): void {
    let max = 0;
    for (let i = 0; i < this.heights.length; i++) max = Math.max(max, this.heights[i]);
    if (max < 5) return;
    const top: Array<[number, number]> = [];
    for (let x = 0; x <= this.W + BIN; x += BIN) {
      const i = Math.min(this.heights.length - 1, Math.floor(x / BIN));
      const jag = Math.sin(x * 0.37) * 2.4 + Math.sin(x * 0.11 + 1.3) * 3;
      top.push([x, this.Hd - Math.max(0, this.heights[i]) + (this.heights[i] > 3 ? jag : 0)]);
    }
    ctx.beginPath();
    ctx.moveTo(0, this.Hd + 4);
    for (const [x, y] of top) ctx.lineTo(x, y);
    ctx.lineTo(this.W + BIN, this.Hd + 4);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, this.Hd - max, 0, this.Hd);
    const light = isLightTheme();
    g.addColorStop(0, light ? "rgba(168,160,190,0.6)" : "rgba(22,16,44,0.62)");
    g.addColorStop(1, light ? "rgba(112,102,142,0.85)" : "rgba(6,4,14,0.8)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.beginPath();
    top.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = this.accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = this.accent2;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  private drawCracks(ctx: CanvasRenderingContext2D): void {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const b of this.bodies) {
      if (b.hidden || b.ghost) continue;
      const off = this.off(b);
      if (b.y + off + b.h / 2 < this.sy - 40 || b.y + off - b.h / 2 > this.sy + this.H + 40) continue;
      const stage = this.rebootAt ? 0 : (this.clock - b.crackStart) / 760;
      const p = clamp(stage, 0, 1);
      if (p <= 0) continue;
      ctx.save();
      ctx.translate(b.x, b.y + off);
      ctx.rotate(b.a);
      ctx.scale(b.sx, b.sy);
      for (const crack of b.cracks) {
        const n = Math.max(1, Math.round(crack.pts.length * p));
        ctx.beginPath();
        ctx.moveTo(crack.pts[0][0], crack.pts[0][1]);
        for (let i = 1; i < n; i++) ctx.lineTo(crack.pts[i][0], crack.pts[i][1]);
        ctx.strokeStyle = "rgba(216,180,254,0.35)";
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.strokeStyle = "rgba(235,250,255,0.95)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

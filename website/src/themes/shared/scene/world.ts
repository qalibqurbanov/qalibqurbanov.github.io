import type { SceneEnv } from "./types";

/** One sort of object a theme scatters through the page (a planet, a jellyfish, a column...). */
export interface Kind<S = unknown> {
  id: string;
  /** How often it is picked next to the others. */
  weight: number;
  /** The size range, as a radius in px (scaled down on small screens). */
  radius: [number, number];
  /** How much it follows the scroll: 1 moves with the page, lower is farther away and moves less. */
  depth: [number, number];
  /** "edge" keeps it to the outer margins, "side" to the outer third, "any" lets it stand anywhere. */
  zone?: "any" | "side" | "edge";
  /** The part of the page, as a fraction of its length, where it belongs: a deep-sea creature lives near the end. */
  band?: [number, number];
  /** How many of it may stand on one page. A specific object (a bust, a car) is 1; a family of procedural
   * creatures defaults to 2 so a page never fills with copies. */
  max?: number;
  /** "ledge": it stands on the top edge of a content card (like an ornament on a shelf) instead of floating,
   * so it keeps the page's own scroll (depth 1) and is placed only where there is free space above the card. */
  anchor?: "ledge";
  /** How far past its radius it can paint (tentacles, rays, rings), for culling. */
  reach?: number;
  make(rnd: () => number, radius: number, depth: number): S;
  /** Moves it one step. `x`, `y` are where it is on screen now. */
  update?(s: S, e: SceneEnv, x: number, y: number, r: number): void;
  /** Draws it centred on `x`, `y`, with the overall opacity `a`. */
  draw(g: CanvasRenderingContext2D, s: S, e: SceneEnv, x: number, y: number, r: number, a: number): void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  /** How much an object over it matters: text and controls are 1, a card's glass less. */
  weight: number;
}

interface Item {
  kind: Kind;
  state: unknown;
  /** Screen position the object has when the page is scrolled to `scroll`. */
  x: number;
  y: number;
  scroll: number;
  depth: number;
  r: number;
  alpha: number;
  born: number;
  failed?: boolean;
}

const TEXT_SELECTOR = "main :is(h1, h2, h3, h4, p, li, dd, dt, button, a, input, textarea, img, code, pre), footer :is(p, a, button, span), header";
const GLASS_SELECTOR = "main .card-surface";

export interface WorldOptions {
  /** About how many objects stand in each screenful of the page. */
  perScreen: number;
  /** Where the page's own content stands relative to the objects; objects are dimmed where it is. */
  /** How strongly the page colour is laid over the column the text stands in, 0 to 1. */
  veil?: number;
}

/** A page-long scatter of objects, drawn on a viewport-sized canvas in the page's own coordinates.
 *
 * The layout is rolled when the world is made (so every page load and every theme activation gets a
 * new composition) and again whenever the page's size changes. It is stratified down the page, so
 * every part of it has some, and each object is placed where it covers the least text, the
 * controls and the other objects; what still overlaps is dimmed. Objects are painted behind the
 * content, so they can never get in the way of a click. */
export function createWorld(kinds: Kind[], options: WorldOptions) {
  let items: Item[] = [];
  let rects: Rect[] = [];
  let ledges: Rect[] = [];
  let layoutKey = "";
  let timer = 0;
  let lastEnv: SceneEnv | null = null;

  function measure() {
    rects = [];
    const sx = window.scrollX;
    const sy = window.scrollY;
    const add = (selector: string, weight: number) => {
      document.querySelectorAll(selector).forEach((node) => {
        const r = node.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return;
        rects.push({ x: r.left + sx, y: r.top + sy, w: r.width, h: r.height, weight });
      });
    };
    add(TEXT_SELECTOR, 1);
    add(GLASS_SELECTOR, 0.3);
    ledges = rects.filter((q) => q.weight === 0.3 && q.w > 240);
  }

  function pick(rnd: () => number, recent: string[], progress: number, used: Map<string, number>): Kind | null {
    const weights = kinds.map((k) => {
      if ((used.get(k.id) ?? 0) >= (k.max ?? 2)) return 0;
      const inBand = !k.band || (progress >= k.band[0] && progress <= k.band[1]);
      return inBand ? k.weight * (recent.includes(k.id) ? (recent[recent.length - 1] === k.id ? 0.12 : 0.5) : 1) : 0;
    });
    // nothing belongs at this point of the page: leave it empty
    if (weights.every((w) => w === 0)) return null;
    let t = rnd() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < kinds.length; i++) {
      t -= weights[i];
      if (t <= 0) return kinds[i];
    }
    return kinds[kinds.length - 1];
  }

  function layout(e: SceneEnv) {
    measure();
    lastEnv = e;
    const S = Math.max(0, document.documentElement.scrollHeight - e.h);
    layoutKey = `${Math.round(e.w / 40)}|${Math.round(S / 200)}`;
    const small = Math.min(1, Math.max(0.55, e.w / 1100));
    const count = Math.max(3, Math.round(((S + e.h) / e.h) * options.perScreen));
    const placed: { x: number; docY: number; r: number }[] = [];
    const next: Item[] = [];
    const recent: string[] = [];
    const used = new Map<string, number>();
    const rnd = Math.random;

    for (let i = 0; i < count; i++) {
      // Evenly down the page, with a little jitter so the spacing never reads as a grid.
      const scroll = ((i + 0.15 + rnd() * 0.7) / count) * S;
      const kind = pick(rnd, recent.slice(-2), S > 0 ? scroll / S : 0, used);
      if (!kind) continue;
      used.set(kind.id, (used.get(kind.id) ?? 0) + 1);
      recent.push(kind.id);
      const r = (kind.radius[0] + rnd() * (kind.radius[1] - kind.radius[0])) * small;
      const depth = kind.anchor === "ledge" ? 1 : kind.depth[0] + rnd() * (kind.depth[1] - kind.depth[0]);
      let best = { x: e.w / 2, y: e.h / 2, score: Infinity };
      if (kind.anchor === "ledge") {
        // stand on the top edge of a card that is on screen at this point of the page
        const here = ledges.filter((q) => q.y - scroll > r * 1.4 && q.y - scroll < e.h * 0.95);
        let found = false;
        for (let tries = 0; tries < 24 && here.length; tries++) {
          const q = here[Math.floor(rnd() * here.length)];
          const x = q.x + r + rnd() * Math.max(1, q.w - r * 2);
          const y = q.y - scroll - r * 0.9;
          const box = { x: x - r, y: y - r + scroll, w: r * 2, h: r * 1.7 };
          let covered = 0;
          for (const t of rects) {
            if (t.weight < 1) continue;
            const ox = Math.min(box.x + box.w, t.x + t.w) - Math.max(box.x, t.x);
            const oy = Math.min(box.y + box.h, t.y + t.h) - Math.max(box.y, t.y);
            if (ox > 0 && oy > 0) covered += ox * oy;
          }
          const score = covered / (box.w * box.h);
          if (!found || score < best.score) {
            best = { x, y, score };
            found = true;
          }
          if (score < 0.03) break;
        }
        if (!found) continue;
      } else
      for (let tries = 0; tries < 48; tries++) {
        const u = rnd();
        const x =
          kind.zone === "edge"
            ? (rnd() < 0.5 ? u * 0.16 : 1 - u * 0.16) * e.w
            : kind.zone === "side"
              ? (rnd() < 0.5 ? u * 0.34 : 1 - u * 0.34) * e.w
              : (0.04 + u * 0.92) * e.w;
        const y = r * 0.4 + rnd() * Math.max(1, e.h - r * 0.8);
        // How much of what is under it (at the moment it is centred) it would cover.
        const box = { x: x - r, y: y - r + scroll, w: r * 2, h: r * 2 };
        let covered = 0;
        for (const q of rects) {
          const ox = Math.min(box.x + box.w, q.x + q.w) - Math.max(box.x, q.x);
          const oy = Math.min(box.y + box.h, q.y + q.h) - Math.max(box.y, q.y);
          if (ox > 0 && oy > 0) covered += ox * oy * q.weight;
        }
        let score = covered / (box.w * box.h);
        const docY = y + scroll;
        for (const p of placed) {
          const d = Math.hypot(p.x - x, p.docY - docY);
          if (d < (p.r + r) * 1.05) score += 2;
        }
        if (score < best.score) best = { x, y, score };
        if (score < 0.02) break;
      }
      placed.push({ x: best.x, docY: best.y + scroll, r });
      next.push({
        kind,
        state: kind.make(rnd, r, depth),
        x: best.x,
        y: best.y,
        scroll,
        depth,
        r,
        alpha: Math.max(0.25, 1 - Math.min(0.72, best.score * 2.4)),
        born: e.t + rnd() * 0.8,
      });
    }
    next.sort((a, b) => a.depth - b.depth);
    items = next;
  }

  // Sections load after the first paint and images change the height, so the page is measured again
  // when its size has changed enough to matter.
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (!lastEnv) return;
      const S = Math.max(0, document.documentElement.scrollHeight - lastEnv.h);
      const key = `${Math.round(lastEnv.w / 40)}|${Math.round(S / 200)}`;
      if (key !== layoutKey) layout(lastEnv);
    }, 600);
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(document.body);

  return {
    frame(g: CanvasRenderingContext2D, e: SceneEnv) {
      if (!lastEnv) layout(e);
      lastEnv = e;
      g.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
      g.clearRect(0, 0, e.w, e.h);
      for (const it of items) {
        const reach = (it.kind.reach ?? 1.4) * it.r;
        const y = it.y + (it.scroll - e.scrollY) * it.depth;
        if (y < -reach || y > e.h + reach) continue;
        // Far things lean a little with the cursor, near things a little more.
        const x = it.x - (e.mx - e.w / 2) * 0.018 * (1.2 - it.depth) * (e.seen ? 1 : 0);
        const fade = Math.min(1, Math.max(0, (e.t - it.born) / 1.4));
        if (fade <= 0 || it.failed) continue;
        // One misbehaving object must not stop the others, or the rest of the scene.
        try {
          it.kind.update?.(it.state, e, x, y, it.r);
          it.kind.draw(g, it.state, e, x, y, it.r, it.alpha * fade * (e.light ? 0.85 : 1));
        } catch (error) {
          if (!it.failed) console.warn(`theme object "${it.kind.id}" failed`, error);
          it.failed = true;
        }
      }
      // objects behind the text column are calmer than those in the margins
      this.veil(g, e, 1.15);
    },
    /** Lays the page colour over the column the text stands in, fading out toward the margins, so
     * whatever is behind the text is calmer than what is beside it. Call it on a canvas after drawing. */
    veil(g: CanvasRenderingContext2D, e: SceneEnv, scale = 1) {
      const strength = (options.veil ?? 0.3) * scale;
      if (strength <= 0) return;
      const half = Math.min(e.w * 0.5, 600);
      const cx = e.w / 2;
      const grad = g.createLinearGradient(0, 0, e.w, 0);
      const at = (x: number) => Math.min(1, Math.max(0, x / e.w));
      const c = `${e.bg[0] | 0},${e.bg[1] | 0},${e.bg[2] | 0}`;
      grad.addColorStop(0, `rgba(${c},0)`);
      grad.addColorStop(at(cx - half * 1.2), `rgba(${c},0)`);
      grad.addColorStop(at(cx - half * 0.75), `rgba(${c},${strength})`);
      grad.addColorStop(at(cx + half * 0.75), `rgba(${c},${strength})`);
      grad.addColorStop(at(cx + half * 1.2), `rgba(${c},0)`);
      grad.addColorStop(1, `rgba(${c},0)`);
      g.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
      g.fillStyle = grad;
      g.fillRect(0, 0, e.w, e.h);
    },
    /** The viewport changed: roll the layout again. */
    relayout(e: SceneEnv) {
      layout(e);
    },
    destroy() {
      window.clearTimeout(timer);
      observer.disconnect();
    },
  };
}

/** Hover-only border glitch: while the cursor is over a `.card-surface` /
 * `.btn-pulse` (or the `.card-hit` wrapping a card), random segments of its
 * border flash at random intervals. This only sets the CSS custom properties
 * `styles/index.css` reads (--in-*, --cp-*, --col-*) plus the
 * `is-glitching` class; the drawing itself is CSS. Installed once, via event
 * delegation, so every surface behaves identically with no per-component
 * wiring. */

const SURFACE = ".card-surface, .btn-pulse";

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function resolveSurface(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const hit = target.closest<HTMLElement>(".card-hit");
  if (hit?.matches(".card-hit")) {
    const inner = hit.querySelector<HTMLElement>(":scope > .card-surface");
    if (inner) return inner;
  }
  return target.closest<HTMLElement>(SURFACE);
}

/** Random fragments of a w×h ring, as a px `path()` clip. Each fragment sits
 * at a uniformly random spot on the perimeter (so every side, corners
 * included, is equally likely), with a random length and thickness; the odd
 * one is a full-width/height tear instead. Nothing is reused between calls. */
function fragments(w: number, h: number, count: number): string {
  const perimeter = 2 * (w + h);
  let d = "";
  const rect = (x: number, y: number, rw: number, rh: number) => {
    d += `M${x.toFixed(1)} ${y.toFixed(1)}h${rw.toFixed(1)}v${rh.toFixed(1)}h${(-rw).toFixed(1)}z`;
  };
  for (let i = 0; i < count; i++) {
    const thick = rand(5, 18);
    if (Math.random() < 0.15) {
      if (Math.random() < 0.5) rect(0, rand(0, h), w, rand(2, 10));
      else rect(rand(0, w), 0, rand(2, 10), h);
      continue;
    }
    const pos = Math.random() * perimeter;
    const len = rand(0.03, 0.25) * perimeter;
    if (pos < w) rect(pos, 0, Math.min(len, w - pos) + thick, thick); // top
    else if (pos < w + h) rect(w - thick, pos - w, thick, Math.min(len, w + h - pos) + thick); // right
    else if (pos < 2 * w + h) {
      const u = pos - w - h; // bottom, walked right to left
      rect(Math.max(0, w - u - len), h - thick, Math.min(len, w - u) + thick, thick);
    } else {
      const u = pos - 2 * w - h; // left, walked bottom to top
      rect(0, Math.max(0, h - u - len), thick, Math.min(len, h - u) + thick);
    }
  }
  return d ? `path("${d}")` : 'path("M0 0")';
}

/** One frame of the glitch: each ghost ring gets its own random per-side
 * inset, fragments and colour, so no two frames (or bursts) look alike. */
function frame(el: HTMLElement) {
  const set = (k: string, v: string) => el.style.setProperty(k, v);
  const W = el.clientWidth;
  const H = el.clientHeight;
  const ghost = (key: "a" | "b", count: number) => {
    const t = rand(0, 7);
    const r = rand(0, 7);
    const b = rand(0, 7);
    const l = rand(0, 7);
    set(`--in-${key}`, `${t}px ${r}px ${b}px ${l}px`);
    set(`--cp-${key}`, fragments(Math.max(1, W - l - r), Math.max(1, H - t - b), count));
  };
  ghost("a", 1 + Math.floor(Math.random() * 4));
  ghost("b", Math.floor(Math.random() * 4));
  const swap = Math.random() < 0.5;
  set("--col-a", swap ? "var(--glitch-2)" : "var(--glitch-1)");
  set("--col-b", swap ? "var(--glitch-1)" : "var(--glitch-2)");
  el.classList.add("is-glitching");
}

function clear(el: HTMLElement) {
  el.classList.remove("is-glitching");
}

export function installBorderGlitch(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const timers = new WeakMap<HTMLElement, number>();

  const tick = (el: HTMLElement) => {
    timers.set(
      el,
      window.setTimeout(() => burst(el, 1 + Math.floor(Math.random() * 8)), Math.random() < 0.25 ? rand(80, 300) : rand(300, 1800)),
    );
  };

  // A burst is a handful of rapid, irregular frames with the border briefly
  // clean in between — that stutter is what reads as a glitch.
  const burst = (el: HTMLElement, frames: number) => {
    if (frames <= 0) {
      clear(el);
      tick(el);
      return;
    }
    if (Math.random() < 0.8) frame(el);
    else clear(el);
    timers.set(el, window.setTimeout(() => burst(el, frames - 1), rand(25, 140)));
  };

  const stop = (el: HTMLElement) => {
    window.clearTimeout(timers.get(el));
    timers.delete(el);
    clear(el);
  };

  document.addEventListener(
    "mouseenter",
    (e) => {
      const el = resolveSurface(e.target);
      if (el && e.target instanceof Element && (e.target.matches(SURFACE) || e.target.matches(".card-hit"))) {
        if (!timers.has(el)) tick(el);
      }
    },
    true,
  );
  document.addEventListener(
    "mouseleave",
    (e) => {
      const el = resolveSurface(e.target);
      if (el && e.target instanceof Element && (e.target.matches(SURFACE) || e.target.matches(".card-hit"))) {
        stop(el);
      }
    },
    true,
  );
}

/** One short burst of border glitch on `el` without any hovering — used when
 * a view opens. `el` needs the same markup the hover glitch draws on
 * (`.card-surface`, `.btn-pulse` or `.glitch-border`). */
export function borderBurst(el: HTMLElement, frames = 7): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let left = frames;
  const run = () => {
    if (left-- <= 0 || !el.isConnected) {
      clear(el);
      return;
    }
    if (Math.random() < 0.8) frame(el);
    else clear(el);
    window.setTimeout(run, rand(25, 140));
  };
  run();
}

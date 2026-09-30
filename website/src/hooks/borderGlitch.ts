/** Hover-only border glitch: while the cursor is over a `.card-surface` /
 * `.btn-pulse` (or the `.card-hit` wrapping a card), random segments of its
 * border flash at random intervals. This only sets the CSS custom properties
 * `styles/index.css` reads (--gx/--gy/--gw/--gh/--gj/--glitch-color) plus the
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

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

/** Clip shapes a ghost ring can be cut to — each keeps only a fragment of
 * the border, in a different way. */
const SHAPES: readonly (() => string)[] = [
  // horizontal tear
  () => {
    const top = rand(0, 92);
    return `inset(${top}% 0 ${100 - Math.min(100, top + rand(3, 30))}% 0)`;
  },
  // vertical tear
  () => {
    const left = rand(0, 92);
    return `inset(0 ${100 - Math.min(100, left + rand(3, 25))}% 0 ${left}%)`;
  },
  // blocky fragment
  () => {
    const l = rand(0, 80);
    const t = rand(0, 80);
    return `inset(${t}% ${100 - l - rand(8, 30)}% ${100 - t - rand(15, 50)}% ${l}%)`;
  },
  // slanted slice
  () => {
    const y = rand(0, 85);
    const h = rand(6, 30);
    const skew = rand(-25, 25);
    return `polygon(0 ${y}%, 100% ${y + skew}%, 100% ${y + skew + h}%, 0 ${y + h}%)`;
  },
  // thin scan stripe
  () => {
    const y = rand(0, 98);
    return `inset(${y}% 0 ${100 - y - rand(0.8, 3)}% 0)`;
  },
  // half of the border
  () => pick(["inset(0 50% 0 0)", "inset(0 0 0 50%)", "inset(0 0 50% 0)", "inset(50% 0 0 0)"]),
  // whole ring (a pure RGB-split flash)
  () => "inset(0)",
];

let lastShape = -1;

function shape(): string {
  let i = Math.floor(Math.random() * SHAPES.length);
  if (i === lastShape) i = (i + 1 + Math.floor(Math.random() * (SHAPES.length - 1))) % SHAPES.length;
  lastShape = i;
  return SHAPES[i]();
}

/** One frame of the glitch: independently re-rolled shapes, offsets and
 * colours for each ghost, so no two frames (or bursts) look alike. */
function frame(el: HTMLElement) {
  const set = (k: string, v: string) => el.style.setProperty(k, v);
  const split = rand(1, 10);
  const vertical = Math.random() < 0.3;
  const both = Math.random() < 0.7; // sometimes only one ghost appears
  set("--cp-a", shape());
  set("--cp-b", both ? shape() : "inset(50% 50% 50% 50%)");
  set("--dx-a", `${vertical ? rand(-2, 2) : -split}px`);
  set("--dx-b", `${vertical ? rand(-2, 2) : split * rand(0.4, 1.4)}px`);
  set("--dy-a", `${vertical ? -split : rand(-2, 2)}px`);
  set("--dy-b", `${vertical ? split : rand(-2, 2)}px`);
  const [ca, cb] = Math.random() < 0.5 ? ["var(--color-accent)", "var(--color-accent-2)"] : ["var(--color-accent-2)", "var(--color-accent)"];
  set("--col-a", ca);
  set("--col-b", cb);
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

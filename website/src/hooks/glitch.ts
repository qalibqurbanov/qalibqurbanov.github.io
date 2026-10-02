/** The site's glitch vocabulary beyond the card borders (see borderGlitch.ts):
 * text that RGB-splits, rules whose segments break off and slide to another
 * row, and a full-screen flash. Like the border glitch, this only sets the
 * CSS custom properties and `is-glitching-*` classes that `styles/index.css`
 * draws from; every frame is re-rolled, so no two bursts look alike. The two
 * ghost colours are always the theme's accent and accent-2. */

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const sign = () => (Math.random() < 0.5 ? -1 : 1);

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Runs `frames` rapid, irregular frames, with the odd clean frame between
 * them — that stutter is what reads as a glitch rather than a shake. Returns
 * a cancel function that also leaves the element clean. */
function burst(step: () => void, clear: () => void, frames: number): () => void {
  let left = frames;
  let timer = 0;
  const run = () => {
    if (left-- <= 0) {
      clear();
      return;
    }
    if (Math.random() < 0.8) step();
    else clear();
    timer = window.setTimeout(run, rand(25, 110));
  };
  run();
  return () => {
    window.clearTimeout(timer);
    clear();
  };
}

/** A horizontal band of an element, as a `clip-path`. */
function slice(): string {
  const top = rand(0, 85);
  const height = rand(6, 30);
  return `inset(${top.toFixed(1)}% 0 ${Math.max(0, 100 - top - height).toFixed(1)}% 0)`;
}

/** Text glitch: two ghost copies of the text (the element's `::before` /
 * `::after`, which read `data-text`) are cut into random bands and nudged
 * sideways in the two accent colours, while the text itself jitters. */
export function textBurst(el: HTMLElement, frames = 6): () => void {
  const set = (key: string, value: string) => el.style.setProperty(key, value);
  const step = () => {
    set("--gc-a", slice());
    set("--gx-a", `${(sign() * rand(2, 8)).toFixed(1)}px`);
    // The second ghost sits out some frames, so the split isn't always double.
    set("--gc-b", Math.random() < 0.7 ? slice() : "inset(100% 0 0 0)");
    set("--gx-b", `${(sign() * rand(2, 8)).toFixed(1)}px`);
    set("--gj", `${rand(-1.5, 1.5).toFixed(1)}px`);
    el.classList.add("is-glitching-text");
  };
  const clear = () => el.classList.remove("is-glitching-text");
  return burst(step, clear, frames);
}

type Segment = [x: number, length: number];

const rects = (segments: Segment[], y: number, height: number) =>
  segments
    .map(([x, length]) => `M${x.toFixed(1)} ${y}h${length.toFixed(1)}v${height}h${(-length).toFixed(1)}z`)
    .join("");

/** Rule glitch: the 1px line is split into a few non-overlapping segments;
 * each one is cut out of the line and redrawn a few pixels above or below in
 * an accent colour, as if that stretch of the line had slipped a row. */
export function ruleBurst(el: HTMLElement, frames = 6): () => void {
  const set = (key: string, value: string) => el.style.setProperty(key, value);
  const step = () => {
    const width = el.clientWidth;
    if (width < 40) return;
    const bands = Math.min(8, Math.max(2, Math.round(width / 140)));
    const bandWidth = width / bands;
    const a: Segment[] = [];
    const b: Segment[] = [];
    for (let i = 0; i < bands; i++) {
      if (Math.random() > 0.55) continue;
      const x = i * bandWidth + rand(0, bandWidth * 0.4);
      const length = Math.min(rand(0.15, 0.55) * bandWidth, (i + 1) * bandWidth - x);
      (Math.random() < 0.6 ? a : b).push([x, length]);
    }
    if (a.length + b.length === 0) a.push([rand(0, width * 0.7), rand(12, width * 0.2)]);

    set("--gr-a", a.length ? `path("${rects(a, 0, 4)}")` : 'path("M0 0")');
    set("--gr-b", b.length ? `path("${rects(b, 0, 4)}")` : 'path("M0 0")');
    set("--gr-y-a", `${(sign() * rand(2, 5)).toFixed(1)}px`);
    set("--gr-y-b", `${(sign() * rand(2, 5)).toFixed(1)}px`);
    // The base line loses exactly the stretches that were redrawn elsewhere
    // (even-odd fill: the segments are holes cut from the full-width rect).
    set("--gr-base", `path(evenodd, "M0 -1h${width}v3h${-width}z${rects([...a, ...b], -1, 3)}")`);
    el.classList.add("is-glitching-rule");
  };
  const clear = () => el.classList.remove("is-glitching-rule");
  return burst(step, clear, frames);
}

/** Lets code that doesn't own an element (the section-jump highlight) set off
 * its glitch: components register their element with `registerGlitch`, and
 * `triggerGlitch` fires everything registered inside a root. */
const triggers = new WeakMap<Element, () => void>();

export function registerGlitch(el: Element, fire: () => void): () => void {
  triggers.set(el, fire);
  el.setAttribute("data-glitch", "");
  return () => {
    triggers.delete(el);
    el.removeAttribute("data-glitch");
  };
}

export function triggerGlitch(root: ParentNode): void {
  if (prefersReducedMotion()) return;
  root.querySelectorAll("[data-glitch]").forEach((el) => triggers.get(el)?.());
}

/** Full-screen glitch: a few thin bars in the accent colours flash across the
 * page for a third of a second. Fired on theme and language switches. */
export function glitchScreen(): void {
  if (prefersReducedMotion()) return;
  const overlay = document.createElement("div");
  overlay.className = "glitch-screen";
  overlay.setAttribute("aria-hidden", "true");
  document.body.appendChild(overlay);

  const frame = () => {
    overlay.replaceChildren();
    const count = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const bar = document.createElement("i");
      bar.style.top = `${rand(0, 98).toFixed(1)}%`;
      bar.style.height = `${rand(2, 46).toFixed(0)}px`;
      bar.style.transform = `translateX(${(sign() * rand(0, 40)).toFixed(0)}px)`;
      bar.style.background = Math.random() < 0.5 ? "var(--color-accent)" : "var(--color-accent-2)";
      overlay.appendChild(bar);
    }
  };

  let frames = 5;
  const run = () => {
    if (frames-- <= 0) {
      overlay.remove();
      return;
    }
    frame();
    window.setTimeout(run, rand(40, 80));
  };
  run();
}

const SCRAMBLE = "abcdefghijklmnopqrstuvwxyz0123456789#%&$@!?<>/[]{}=+*^~";

/** Decodes an element's text in: every character starts as noise and locks
 * into place left to right. The element must hold a single text node, with
 * the real text mirrored in `data-text` (see GlitchText). Its width is held
 * for the duration so the noise doesn't shove neighbours around. */
export function decodeText(el: HTMLElement, duration = 700): () => void {
  const node = el.firstChild;
  if (!(node instanceof Text)) return () => {};
  const finalText = () => el.dataset.text ?? node.nodeValue ?? "";
  el.style.minWidth = `${el.offsetWidth}px`;

  let raf = 0;
  const finish = () => {
    node.nodeValue = finalText();
    el.style.minWidth = "";
  };
  const start = performance.now();
  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    const text = finalText();
    const locked = Math.floor(progress * text.length);
    let out = "";
    for (let i = 0; i < text.length; i++) {
      out += i < locked || text[i] === " " ? text[i] : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
    }
    node.nodeValue = out;
    if (progress < 1) raf = requestAnimationFrame(tick);
    else finish();
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    finish();
  };
}

/** A bright scan line sweeping the screen top to bottom (or bottom to top),
 * played while the page jumps to another section. */
export function scanWipe(direction: "down" | "up"): void {
  if (prefersReducedMotion()) return;
  const el = document.createElement("div");
  el.className = `scan-wipe scan-wipe-${direction}`;
  el.setAttribute("aria-hidden", "true");
  el.addEventListener("animationend", () => el.remove(), { once: true });
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 1500);
}

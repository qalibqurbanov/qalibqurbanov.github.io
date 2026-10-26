import {
  glitchScreen,
  prefersReducedMotion,
  triggerGlitch,
} from "@/hooks/glitch";

/** Small one-off page effects behind the site's easter eggs (the Konami code
 * and the hero terminal's `glitch` / `matrix` commands). */

/** A short message pinned to the bottom of the screen. */
export function showToast(message: string, duration = 2800): void {
  const el = document.createElement("div");
  el.className = "site-toast";
  el.setAttribute("role", "status");
  el.textContent = message;
  document.body.appendChild(el);
  window.setTimeout(() => el.classList.add("is-leaving"), duration);
  window.setTimeout(() => el.remove(), duration + 300);
}

const between = (min: number, max: number) => min + Math.random() * (max - min);

/** Eases a 0 to 1 strength variable on the root up, holds it, and eases it back to 0 over `length`
 * milliseconds. The effects' CSS scales everything by it, so they fade in and out rather than
 * switching on and off. `onFrame` gets the strength on every frame; `onDone` runs once it is back at 0. */
function ramp(
  name: string,
  length: number,
  rise: number,
  fall: number,
  onFrame?: (strength: number) => void,
  onDone?: () => void,
): void {
  const root = document.documentElement;
  const smooth = (k: number) => {
    const c = Math.min(1, Math.max(0, k));
    return c * c * (3 - 2 * c);
  };
  const start = performance.now();
  const step = (now: number) => {
    const t = now - start;
    const strength = smooth(t / rise) * smooth((length - t) / fall);
    root.style.setProperty(name, strength.toFixed(3));
    onFrame?.(strength);
    if (t < length) {
      requestAnimationFrame(step);
    } else {
      root.style.removeProperty(name);
      onDone?.();
    }
  };
  requestAnimationFrame(step);
}

let stormActive = false;

/** Everything glitches at once for five seconds: the page jitters and
 * shifts hue, screen flashes keep firing, and every glitching element on the
 * page (titles, rules, links) fires too. */
export function glitchStorm(duration = 5000): void {
  if (stormActive || prefersReducedMotion()) return;
  stormActive = true;
  const root = document.documentElement;
  root.classList.add("glitch-storm");
  let nextFire = 0;
  // The page jitter eases in and out; the screen flashes and glitching elements fire while it is strong enough.
  ramp(
    "--storm-i",
    duration,
    Math.min(900, duration * 0.3),
    Math.min(1200, duration * 0.4),
    (strength) => {
      const now = performance.now();
      if (strength > 0.25 && now >= nextFire) {
        nextFire = now + 380;
        glitchScreen();
        triggerGlitch(document);
      }
    },
    () => {
      root.classList.remove("glitch-storm");
      stormActive = false;
    },
  );
}

const NOISE_GLYPHS = "#%&$@?/\\<>[]{}=+*0123456789";
let signalActive = false;

/** Signal loss: in bursts, the header, the page and
 * the footer tear sideways, and a good share of the text on screen turns
 * to noise for a moment before snapping back. Runs for `duration` (forever with Infinity)
 * and returns a function that stops it. */
export function signalLoss(duration = 5000): () => void {
  if (signalActive || prefersReducedMotion()) return () => {};
  signalActive = true;

  const root = document.documentElement;
  type Item = { node: Text; text: string; noise: string; el: Element };
  let items: Item[] = [];
  // The text on screen is gathered again for every burst, so what changed in between (another language, a new page) is covered.
  const collect = () => {
    const found: Item[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const el = node.parentElement;
          if (!el || !node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
          return el.closest(
            "script, style, canvas, input, textarea, .tabular-nums, .matrix-rain",
          )
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        },
      },
    );
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      found.push({
        node,
        text: node.nodeValue ?? "",
        noise: "",
        el: node.parentElement as Element,
      });
    }
    items = found;
  };

  const corrupt = (item: Item, chance: number) => {
    // Text that something else rewrote since it was gathered (a typing terminal, or the page
    // changing it in answer to a click) is the new truth: take it as the text to put back, and
    // leave it alone this round, so the old wording is never restored over it.
    const current = item.node.nodeValue ?? "";
    if (item.noise ? current !== item.noise : current !== item.text) {
      item.text = current;
      item.noise = "";
      item.el.classList.remove("signal-dead");
      return;
    }
    let out = "";
    for (const ch of item.text) {
      out +=
        ch !== " " && Math.random() < chance
          ? NOISE_GLYPHS[Math.floor(Math.random() * NOISE_GLYPHS.length)]
          : ch;
    }
    item.noise = out;
    item.node.nodeValue = out;
    item.el.classList.add("signal-dead");
  };
  const restore = () => {
    for (const item of items) {
      if (item.noise && item.node.nodeValue === item.noise)
        item.node.nodeValue = item.text;
      item.noise = "";
      item.el.classList.remove("signal-dead");
    }
  };

  // Bursts of random length at random moments. Inside a burst the strength eases up and back
  // down, and the tearing and the share of text turned to noise follow it.
  const end = Date.now() + duration;
  let timer = 0;
  const burst = () => {
    if (Date.now() >= end) {
      signalActive = false;
      return;
    }
    collect();
    const r = Math.random();
    const length =
      r < 0.3
        ? between(120, 260)
        : r < 0.75
          ? between(260, 600)
          : between(600, 1400);
    const share = between(0.2, 0.8);
    let nextNoise = 0;
    root.style.setProperty("--signal-d", `${Math.round(length)}ms`);
    root.classList.add("signal-loss");
    ramp(
      "--signal-i",
      length,
      Math.min(220, length * 0.4),
      Math.min(260, length * 0.45),
      (strength) => {
        const now = performance.now();
        if (now < nextNoise) return;
        nextNoise = now + between(25, 130);
        restore();
        for (const item of items) {
          if (item.node.isConnected && Math.random() < share * strength)
            corrupt(item, 0.35 * strength);
        }
      },
      () => {
        restore();
        root.classList.remove("signal-loss");
        root.style.removeProperty("--signal-d");
      },
    );
    const calm = Math.random();
    const gap =
      calm < 0.2
        ? between(100, 500)
        : calm < 0.7
          ? between(500, 3000)
          : between(3000, 8000);
    timer = window.setTimeout(burst, length + gap);
  };
  burst();
  return () => {
    window.clearTimeout(timer);
    signalActive = false;
  };
}

const RAIN_GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789<>/{}=+*";
let rainActive = false;

/** Falling-glyph rain in the accent colour, just above the page background and behind all content. Ends on its own
 * after `duration`, or at once on a key press, click or Escape. */
export function matrixRain(duration = 5000): void {
  if (rainActive || prefersReducedMotion()) return;
  rainActive = true;

  const canvas = document.createElement("canvas");
  canvas.className = "matrix-rain";
  canvas.setAttribute("aria-hidden", "true");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  // Fade in on the next frame so the transition runs.
  requestAnimationFrame(() => canvas.classList.add("is-visible"));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    rainActive = false;
    return;
  }
  const size = 16;
  const color =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim() || "#b185ff";
  const drops = Array.from(
    { length: Math.ceil(canvas.width / size) },
    () => Math.random() * -60,
  );
  let ending = false;

  const draw = () => {
    // Fading what is already there (rather than painting a background over
    // it) leaves trails while the page underneath stays visible.
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = color;
    ctx.font = `${size}px monospace`;
    drops.forEach((row, column) => {
      const glyph = RAIN_GLYPHS[Math.floor(Math.random() * RAIN_GLYPHS.length)];
      ctx.fillText(glyph, column * size, row * size);
      // Once ending, streams are not restarted: the rain thins out and runs dry.
      const offscreen = row * size > canvas.height;
      drops[column] =
        offscreen && !ending && Math.random() > 0.975 ? 0 : row + 1;
    });
  };

  const interval = window.setInterval(draw, 50);
  const stop = () => {
    if (ending) return;
    ending = true;
    window.clearTimeout(timer);
    window.removeEventListener("keydown", stop);
    window.removeEventListener("pointerdown", stop);
    canvas.classList.remove("is-visible");
    window.setTimeout(() => {
      window.clearInterval(interval);
      canvas.remove();
      rainActive = false;
    }, 1800);
  };
  const timer = window.setTimeout(stop, duration);
  window.addEventListener("keydown", stop);
  window.addEventListener("pointerdown", stop);
}

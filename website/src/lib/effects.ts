import { glitchScreen, prefersReducedMotion, triggerGlitch } from "@/hooks/glitch";

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

let stormActive = false;

/** Everything glitches at once for five seconds: the page jitters and
 * shifts hue, screen flashes keep firing, and every glitching element on the
 * page (titles, rules, links) fires too. */
export function glitchStorm(duration = 5000): void {
  if (stormActive || prefersReducedMotion()) return;
  stormActive = true;
  const root = document.documentElement;
  root.classList.add("glitch-storm");
  const fire = () => {
    glitchScreen();
    triggerGlitch(document);
  };
  fire();
  const interval = window.setInterval(fire, 380);
  window.setTimeout(() => {
    window.clearInterval(interval);
    root.classList.remove("glitch-storm");
    stormActive = false;
  }, duration);
}

const NOISE_GLYPHS = "#%&$@?/\\<>[]{}=+*0123456789";
let signalActive = false;

/** Signal loss, same as the 404 page: in bursts, the header, the page and
 * the footer tear sideways, and a good share of the text on screen turns
 * to noise for a moment before snapping back. Runs for `duration`. */
export function signalLoss(duration = 5000): void {
  if (signalActive || prefersReducedMotion()) return;
  signalActive = true;

  const root = document.documentElement;
  const items: Array<{ node: Text; text: string; noise: string; el: Element }> = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const el = node.parentElement;
      if (!el || !node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      return el.closest("script, style, canvas, input, textarea, .tabular-nums, .matrix-rain")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    items.push({ node, text: node.nodeValue ?? "", noise: "", el: node.parentElement as Element });
  }

  const corrupt = (item: (typeof items)[number]) => {
    // Skip text that something else rewrote in the meantime (a typing terminal).
    if (item.noise && item.node.nodeValue !== item.noise) return;
    let out = "";
    for (const ch of item.text) {
      out += ch !== " " && Math.random() < 0.35 ? NOISE_GLYPHS[Math.floor(Math.random() * NOISE_GLYPHS.length)] : ch;
    }
    item.noise = out;
    item.node.nodeValue = out;
    item.el.classList.add("signal-dead");
  };
  const restore = () => {
    for (const item of items) {
      if (item.noise && item.node.nodeValue === item.noise) item.node.nodeValue = item.text;
      item.noise = "";
      item.el.classList.remove("signal-dead");
    }
  };

  const end = Date.now() + duration;
  const burst = () => {
    if (Date.now() >= end) {
      signalActive = false;
      return;
    }
    root.classList.remove("signal-loss");
    void root.offsetWidth;
    root.classList.add("signal-loss");
    const picked = items.filter((item) => item.node.isConnected && Math.random() < 0.55);
    let frames = 0;
    const frame = () => {
      if (frames++ < 5) {
        picked.forEach(corrupt);
        window.setTimeout(frame, 70);
      } else {
        restore();
        root.classList.remove("signal-loss");
      }
    };
    frame();
    window.setTimeout(burst, 700 + Math.random() * 1600);
  };
  burst();
}

const RAIN_GLYPHS ="ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789<>/{}=+*";
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
  const color = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() || "#b185ff";
  const drops = Array.from({ length: Math.ceil(canvas.width / size) }, () => Math.random() * -60);
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
      drops[column] = offscreen && !ending && Math.random() > 0.975 ? 0 : row + 1;
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

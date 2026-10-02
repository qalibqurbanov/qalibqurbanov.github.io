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

/** Everything glitches at once for a couple of seconds: the page jitters and
 * shifts hue, screen flashes keep firing, and every glitching element on the
 * page (titles, rules, links) fires too. */
export function glitchStorm(duration = 2200): void {
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

const RAIN_GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789<>/{}=+*";
let rainActive = false;

/** Falling-glyph rain over the page in the accent colour. Ends on its own
 * after `duration`, or at once on a key press, click or Escape. */
export function matrixRain(duration = 7000): void {
  if (rainActive || prefersReducedMotion()) return;
  rainActive = true;

  const canvas = document.createElement("canvas");
  canvas.className = "matrix-rain";
  canvas.setAttribute("aria-hidden", "true");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    rainActive = false;
    return;
  }
  const size = 16;
  const color = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() || "#7cf5c4";
  const drops = Array.from({ length: Math.ceil(canvas.width / size) }, () => Math.random() * -40);

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
      drops[column] = row * size > canvas.height && Math.random() > 0.975 ? 0 : row + 1;
    });
  };

  const interval = window.setInterval(draw, 50);
  const stop = () => {
    window.clearInterval(interval);
    window.clearTimeout(timer);
    window.removeEventListener("keydown", stop);
    window.removeEventListener("pointerdown", stop);
    canvas.classList.add("is-leaving");
    window.setTimeout(() => {
      canvas.remove();
      rainActive = false;
    }, 400);
  };
  const timer = window.setTimeout(stop, duration);
  window.addEventListener("keydown", stop);
  window.addEventListener("pointerdown", stop);
}

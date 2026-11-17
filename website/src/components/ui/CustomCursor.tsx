import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion";

type CursorState = "default" | "link" | "field" | "code" | "grab" | "no" | "help" | "download";

const FIELD =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]';
const LINK =
  'a[href], button:not(:disabled), summary, select, label[for], [role="button"], [role="tab"], [role="option"], [role="menuitem"], [role="radio"], [role="checkbox"], .cursor-pointer';
const GRAB = ".cursor-grab, .cursor-grabbing";
const CODE = 'pre, code, .selectable, [data-cursor="code"]';
const DISABLED = ':disabled, [aria-disabled="true"]';
const HELP = '.cursor-help, [data-cursor="help"]';
const DOWNLOAD = "a[download]";

/** The small line glyph each state turns the dot into (a single thin stroke, no panels). */
const GLYPHS: { id: string; box: string; d: string; stretch?: boolean }[] = [
  { id: "link", box: "0 0 20 20", d: "M5.5 14.5 14.5 5.5M7 5.5h7.5V13" },
  { id: "text", box: "0 0 8 20", d: "M4 2v16M1.5 2h5M1.5 18h5", stretch: true },
  { id: "grab", box: "0 0 20 20", d: "M10 2.5v15M2.5 10h15M10 2.5 7.7 4.8M10 2.5l2.3 2.3M10 17.5l-2.3-2.3M10 17.5l2.3-2.3M2.5 10l2.3-2.3M2.5 10l2.3 2.3M17.5 10l-2.3-2.3M17.5 10l-2.3 2.3" },
  { id: "no", box: "0 0 20 20", d: "M5.5 5.5l9 9M14.5 5.5l-9 9" },
  { id: "help", box: "0 0 20 20", d: "M7.4 7.8a2.8 2.8 0 1 1 4.1 2.5c-.9.5-1.5 1-1.5 2.2M10 15.4v.1" },
  { id: "download", box: "0 0 20 20", d: "M10 3.5v9M6.4 9 10 12.6 13.6 9M4 16.5h12" },
];

type Rgb = [number, number, number];
type Token = "accent" | "accent2" | "text" | "danger";

/** How the ribbon behaves in each state: how long it lingers, how wide it is, and its two colours. */
const LOOK: Record<CursorState, { life: number; width: number; a: Token; b: Token }> = {
  default: { life: 1, width: 1, a: "accent", b: "accent2" },
  link: { life: 0.8, width: 1.05, a: "accent2", b: "text" },
  field: { life: 0.2, width: 0.4, a: "accent", b: "accent" },
  code: { life: 0.2, width: 0.4, a: "accent2", b: "accent2" },
  grab: { life: 0.9, width: 1.1, a: "accent", b: "accent2" },
  no: { life: 0.35, width: 0.8, a: "danger", b: "danger" },
  help: { life: 0.8, width: 1, a: "accent", b: "accent2" },
  download: { life: 0.8, width: 1, a: "accent2", b: "accent" },
};

/** The most points the ribbon keeps, whatever the pointer rate. */
const MAX_POINTS = 120;

function stateOf(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return "default";
  if (target.closest(DISABLED)) return "no";
  if (target.closest(FIELD)) return "field";
  if (target.closest(HELP)) return "help";
  if (target.closest(DOWNLOAD)) return "download";
  if (target.closest(LINK)) return "link";
  if (target.closest(GRAB)) return "grab";
  if (target.closest(CODE)) return "code";
  return "default";
}

function readRgb(name: string, fallback: Rgb): Rgb {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, "$&$&") : hex[1];
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(raw);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : fallback;
}

/** Replaces the system cursor on mouse-like pointers: a bright dot with a silk ribbon of light trailing behind it,
 * in the site's cyan and magenta. Over things the dot turns into a thin line glyph that says what the thing does
 * (an arrow over links, an I-beam in text, a move cross on what can be dragged, a cross when disabled, a question
 * mark for help, a tray arrow for downloads). Position goes straight to transforms (no React state). The system
 * cursor is only hidden once a real mouse has moved, so touch and keyboard users never lose it. */
export function CustomCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const ribbonRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    const canvas = ribbonRef.current;
    const g = canvas?.getContext("2d");
    if (!root || !dot || !canvas || !g) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (prefersReducedMotion()) return;

    let x = 0;
    let y = 0;
    let scrollFrame = 0;
    let seen = false;
    let state: CursorState = "default";

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // The drawing is sized from the canvas as it is displayed (the fixed layer stops at the scrollbar, so it is
    // narrower than the window), and scaled to fill it exactly; otherwise the ribbon would drift from the dot.
    let W = 1;
    let H = 1;
    let scaleX = dpr;
    let scaleY = dpr;
    const resizeCanvas = () => {
      const box = canvas.getBoundingClientRect();
      W = Math.max(1, box.width);
      H = Math.max(1, box.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      scaleX = canvas.width / W;
      scaleY = canvas.height / H;
    };
    resizeCanvas();
    const sizeWatcher = new ResizeObserver(resizeCanvas);
    sizeWatcher.observe(canvas);

    const pts: { x: number; y: number; t: number }[] = [];
    const colors: Record<Token, Rgb> = { accent: [0, 229, 255], accent2: [255, 46, 151], text: [233, 233, 245], danger: [255, 77, 109] };
    let light = false;
    const readColors = () => {
      colors.accent = readRgb("--color-accent", colors.accent);
      colors.accent2 = readRgb("--color-accent-2", colors.accent2);
      colors.text = readRgb("--color-text", colors.text);
      colors.danger = readRgb("--color-danger", colors.danger);
      const bg = readRgb("--color-bg", [10, 10, 18]);
      light = (bg[0] * 299 + bg[1] * 587 + bg[2] * 114) / 1000 > 140;
    };
    readColors();
    const look = { life: 1, width: 1, a: [...colors.accent] as Rgb, b: [...colors.accent2] as Rgb };
    let speed = 0;
    let ribbonFrame = 0;
    let lastR = 0;
    let rFrames = 0;
    const rgba = (c: Rgb, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, a)})`;

    const ribbonTick = (now: number) => {
      const dt = Math.min(0.05, (now - lastR) / 1000);
      lastR = now;
      if (++rFrames % 60 === 0) readColors();
      // Ease toward what the current state wants, quickly but softly.
      const k = 1 - Math.exp(-14 * dt);
      const tgt = LOOK[state];
      look.life += (tgt.life - look.life) * k;
      look.width += (tgt.width - look.width) * k;
      for (let i = 0; i < 3; i++) {
        look.a[i] += (colors[tgt.a][i] - look.a[i]) * k;
        look.b[i] += (colors[tgt.b][i] - look.b[i]) * k;
      }
      const life = (340 + Math.min(480, speed * 0.8)) * look.life;
      while (pts.length && now - pts[0].t > life) pts.shift();

      g.setTransform(scaleX, 0, 0, scaleY, 0, 0);
      g.clearRect(0, 0, W, H);
      const n = pts.length;
      if (n > 2) {
        const nr: [number, number][] = [];
        for (let i = 0; i < n; i++) {
          const a = pts[Math.max(0, i - 1)];
          const b = pts[Math.min(n - 1, i + 1)];
          const nx = -(b.y - a.y);
          const ny = b.x - a.x;
          const l = Math.hypot(nx, ny) || 1;
          nr.push([nx / l, ny / l]);
        }
        const w = 8 * look.width * (root.classList.contains("is-down") ? 1.5 : 1);
        const polygon = (widthAt: (i: number) => number) => {
          g.beginPath();
          for (let i = 0; i < n; i++) {
            const half = widthAt(i) * 0.5;
            const px = pts[i].x + nr[i][0] * half;
            const py = pts[i].y + nr[i][1] * half;
            if (i === 0) g.moveTo(px, py);
            else g.lineTo(px, py);
          }
          for (let i = n - 1; i >= 0; i--) {
            const half = widthAt(i) * 0.5;
            g.lineTo(pts[i].x - nr[i][0] * half, pts[i].y - nr[i][1] * half);
          }
          g.closePath();
        };
        const grad = (a0: number, a1: number) => {
          const gr = g.createLinearGradient(pts[0].x, pts[0].y, pts[n - 1].x, pts[n - 1].y);
          gr.addColorStop(0, rgba(look.a, 0));
          gr.addColorStop(0.55, rgba(look.a, a0));
          gr.addColorStop(1, rgba(look.b, a1));
          return gr;
        };
        // A soft glow under the band. Adding light only reads on a dark page.
        if (!light) {
          g.globalCompositeOperation = "lighter";
          polygon((i) => Math.pow(i / (n - 1), 1.3) * w * 2.4);
          g.fillStyle = grad(0.12, 0.2);
          g.fill();
          g.globalCompositeOperation = "source-over";
        }
        polygon((i) => Math.pow(i / (n - 1), 1.3) * w);
        g.fillStyle = grad(0.55, 0.95);
        g.fill();
      }
      ribbonFrame = pts.length ? requestAnimationFrame(ribbonTick) : 0;
    };
    const startRibbon = () => {
      if (ribbonFrame) return;
      lastR = performance.now();
      ribbonFrame = requestAnimationFrame(ribbonTick);
    };

    /** The I-beam is as tall as the line of text it is over. */
    const syncCaret = (target: EventTarget | null) => {
      if (!(target instanceof Element) || (state !== "field" && state !== "code")) return;
      const size = parseFloat(getComputedStyle(target).fontSize);
      root.style.setProperty("--caret-h", `${Math.min(30, Math.max(12, (size || 16) * 1.15)).toFixed(1)}px`);
    };

    const setState = (next: CursorState) => {
      if (next === state) return;
      state = next;
      root.dataset.state = next;
    };

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      if (!seen) {
        seen = true;
        document.documentElement.classList.add("has-cursor");
      }
      root.classList.add("is-on");
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      setState(stateOf(event.target));
      syncCaret(event.target);
      const now = performance.now();
      const last = pts[pts.length - 1];
      if (last) speed += ((Math.hypot(x - last.x, y - last.y) / Math.max(1, now - last.t)) * 1000 - speed) * 0.3;
      pts.push({ x, y, t: now });
      if (pts.length > MAX_POINTS) pts.shift();
      startRibbon();
    };

    // Scrolling moves content under a still pointer; re-check what is there.
    const handleScroll = () => {
      if (!seen || scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const under = document.elementFromPoint(x, y);
        setState(stateOf(under));
        syncCaret(under);
      });
    };

    const handleDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") root.classList.add("is-down");
    };
    const handleUp = () => root.classList.remove("is-down");
    const handleLeave = () => {
      root.classList.remove("is-on", "is-down");
      pts.length = 0;
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerdown", handleDown, { passive: true });
    window.addEventListener("pointerup", handleUp, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("blur", handleLeave);
    document.documentElement.addEventListener("pointerleave", handleLeave);
    return () => {
      cancelAnimationFrame(scrollFrame);
      cancelAnimationFrame(ribbonFrame);
      sizeWatcher.disconnect();
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("blur", handleLeave);
      document.documentElement.removeEventListener("pointerleave", handleLeave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div ref={rootRef} className="custom-cursor" data-state="default" aria-hidden="true">
      <canvas ref={ribbonRef} className="custom-cursor-ribbon" />
      <span ref={dotRef} className="custom-cursor-pos">
        <span className="custom-cursor-dot" />
        {GLYPHS.map((glyph) => (
          <span key={glyph.id} className="custom-cursor-glyph" data-g={glyph.id}>
            <svg viewBox={glyph.box} preserveAspectRatio={glyph.stretch ? "none" : undefined} focusable="false">
              <path d={glyph.d} />
            </svg>
          </span>
        ))}
      </span>
    </div>
  );
}

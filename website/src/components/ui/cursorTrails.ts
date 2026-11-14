type Rgb = [number, number, number];

export interface TrailPaint {
  g: CanvasRenderingContext2D;
  /** The pointer's recent places, oldest first. */
  pts: { x: number; y: number; t: number }[];
  n: number;
  /** The unit normal at each point, for giving the line width. */
  nr: [number, number][];
  /** The width the original ribbon would have at its head, in px. */
  w: number;
  a: Rgb;
  b: Rgb;
  light: boolean;
}

const rgba = (c: Rgb, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a))})`;
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** A tapered band along the points, as a path; `width(i)` is the full width at point i. */
function band({ g, pts, n, nr }: TrailPaint, width: (i: number) => number) {
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const half = width(i) * 0.5;
    const px = pts[i].x + nr[i][0] * half;
    const py = pts[i].y + nr[i][1] * half;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  for (let i = n - 1; i >= 0; i--) {
    const half = width(i) * 0.5;
    g.lineTo(pts[i].x - nr[i][0] * half, pts[i].y - nr[i][1] * half);
  }
  g.closePath();
}

/** The cursor and its behaviour are the same in every style; only the trail it leaves is the style's own.
 * (The original style's silk ribbon is drawn in CustomCursor itself.) */
export function paintThemeTrail(style: string, p: TrailPaint): void {
  const { g, pts, n, w, a, b, light } = p;
  if (style === "vaporwave") {
    // Square pixels on an 8px grid, shrinking and cooling from pink to cyan as they age, dropping out
    // in whole steps like an old display.
    const seen = new Set<string>();
    for (let i = n - 1; i >= 0; i--) {
      const cx = Math.floor(pts[i].x / 8) * 8;
      const cy = Math.floor(pts[i].y / 8) * 8;
      const key = `${cx},${cy}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const age = 1 - i / (n - 1);
      const step = Math.floor(age * 5) / 5;
      const size = 8 * (1 - step * 0.75) * Math.max(0.6, w / 8);
      g.fillStyle = rgba(mix(a, b, step), (1 - step) * (light ? 0.85 : 0.75));
      g.fillRect(cx + (8 - size) / 2, cy + (8 - size) / 2, size, size);
    }
    return;
  }
  if (style === "synthwave") {
    // A neon tube: a wide soft halo, a bright body and a near-white core, hot pink fading to cyan.
    if (!light) g.globalCompositeOperation = "lighter";
    for (const [scale, alpha, mixWhite] of [[2.6, 0.16, 0], [1.2, 0.5, 0.2], [0.42, 0.95, 0.7]] as [number, number, number][]) {
      band(p, (i) => Math.pow(i / (n - 1), 1.1) * w * scale);
      const grad = g.createLinearGradient(pts[0].x, pts[0].y, pts[n - 1].x, pts[n - 1].y);
      grad.addColorStop(0, rgba(b, 0));
      grad.addColorStop(0.5, rgba(mix(b, a, 0.5), alpha * 0.8));
      grad.addColorStop(1, rgba(mix(a, [255, 255, 255], mixWhite), alpha));
      g.fillStyle = grad;
      g.fill();
    }
    g.globalCompositeOperation = "source-over";
    return;
  }
  if (style === "monochrome") {
    // A single fine ink line, sharp and tapering, with no glow: the way a pen would leave it.
    band(p, (i) => Math.pow(i / (n - 1), 1.4) * w * 0.34 + 0.3);
    const grad = g.createLinearGradient(pts[0].x, pts[0].y, pts[n - 1].x, pts[n - 1].y);
    grad.addColorStop(0, rgba(b, 0));
    grad.addColorStop(1, rgba(b, 0.9));
    g.fillStyle = grad;
    g.fill();
    return;
  }
  if (style === "chrome") {
    // A streak of polished metal: a dark core between two bright edges, brightest at the head, as
    // light runs along a rod.
    band(p, (i) => Math.pow(i / (n - 1), 1.2) * w * 1.1);
    const grad = g.createLinearGradient(pts[0].x, pts[0].y, pts[n - 1].x, pts[n - 1].y);
    grad.addColorStop(0, "rgba(160,170,190,0)");
    grad.addColorStop(0.6, light ? "rgba(60,66,80,0.5)" : "rgba(210,218,235,0.5)");
    grad.addColorStop(1, light ? "rgba(20,24,34,0.95)" : "rgba(255,255,255,0.95)");
    g.fillStyle = grad;
    g.fill();
    band(p, (i) => Math.pow(i / (n - 1), 1.2) * w * 0.28);
    g.fillStyle = light ? "rgba(255,255,255,0.8)" : "rgba(30,34,44,0.7)";
    g.fill();
    return;
  }
  // an unknown style: a plain soft band
  band(p, (i) => Math.pow(i / (n - 1), 1.3) * w);
  g.fillStyle = rgba(a, 0.5);
  g.fill();
}

import type { CSSProperties } from "react";
import { useId, useLayoutEffect, useRef, useState } from "react";

const TAU = Math.PI * 2;

/** Everything about how one page's scribble differs from the others' (index 0 to 6; more pages start over). */
const LOOPS = [3, 2, 4, 3, 2, 4, 3]; // how many loops the scribble has
const RISE = [13, 16, 11, 15, 13, 14, 12]; // how tall they are
const CURL = [1.5, 1.9, 1.4, 2.1, 1.6, 1.8, 1.45]; // how open they are
const LEAN = [0.55, 0.7, 0.45, 0.8, 0.35, 0.6, 0.65]; // how far the tops lean right
const LOOP_SCALE = [1, 0.85, 1.15, 0.95, 1.1, 0.9, 1.05]; // the size of the loop that ends the scribble

/** The loop that ends the scribble (it starts at 0, 11 and ends at 27, 9) and the short uneven tails that leave it (each
 * starts at 0, 5 and ends at its width, 5). */
const LOOP = "C8 11 13 3 18 6 C23 10 14 18 11 12 C9 7 18 2 27 9";
const TAILS: { w: number; d: string }[] = [
  { w: 12, d: "C3 3.5 5 6.8 7.5 5.4 S10.5 4.6 12 5" },
  { w: 18, d: "C4 7 6 3 10 5.2 S15 6.6 18 5" },
  { w: 9, d: "C2 4 4 6.4 5.5 5.3 S8 4.8 9 5" },
  { w: 15, d: "C3 3 5 3.5 7 5.6 S11 7 15 5" },
  { w: 21, d: "C3.5 6.5 6 3.6 9.5 5 S14 6.5 16.5 4.8 S19.5 5 21 5" },
  { w: 11, d: "C2.5 6.2 4.5 3.8 7 5 S9.5 5.8 11 5" },
  { w: 16, d: "C2 3.8 5 3.8 7.5 5.4 S12 6 16 5" },
];

/** Moves and scales a path written in absolute coordinates: its point (sx, sy) goes to (x, y), and every distance is
 * multiplied by `sc`. */
function place(d: string, sx: number, sy: number, x: number, y: number, sc = 1): string {
  return d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, (_, px: string, py: string) => `${(x + (Number(px) - sx) * sc).toFixed(1)} ${(y + (Number(py) - sy) * sc).toFixed(1)}`);
}

const pt = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;
const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** A small seeded random number generator (mulberry32), so a line can be drawn the same way again while it is measured
 * and drawn, and a fresh one is dealt each time the line is going to be written out. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sgn = (n: number) => (n < 0 ? -1 : 1);

/** The marker circle: a rough pen ring round the word, different every time. The pen comes in from the right side of the
 * menu, above the word, sweeps left over it and goes round counter-clockwise, a little over one and a half times (so the
 * second pass overlaps the first), wobbling and tightening or widening as it goes, on a boxy oval that is a little skewed. It is kept inside the word's own row (never more than 18px from the middle, so it cannot reach the rows
 * above and below) and clear of the word itself (inside the word's width the pen never comes within 10.5px of the middle
 * line, so it passes over and under the letters, never through them). It ends at the lower right of the word, then swings
 * out to the scribble's start at (w + 9, middle + 5), heading right. */
function marker(rand: () => number, w: number, cy: number, maxX: number) {
  const cx = w / 2;
  const rx = (w + 18) / 2;
  const ry = 15 + rand() * 2;
  const turns = 1.55 + rand() * 0.2;
  const end = 0.5 + rand() * 0.4;
  const steps = Math.round(turns * 64);
  const [p1, p2, p3] = [rand() * TAU, rand() * TAU, rand() * TAU];
  const e1 = 0.025 + rand() * 0.035;
  const e2 = 0.015 + rand() * 0.025;
  const s0 = 1 + rand() * 0.07;
  const s1 = 0.9 + rand() * 0.08;
  const tilt = (rand() - 0.5) * 0.08;
  const wobble = 0.5 + rand() * 0.7;
  const pts: [number, number][] = [];
  for (let j = 0; j <= steps; j++) {
    const t = j / steps;
    const th = end + TAU * turns * (1 - t);
    const c = Math.cos(th);
    const s = Math.sin(th);
    const r = (1 + e1 * Math.sin(2 * th + p1) + e2 * Math.sin(3 * th + p2)) * (s0 + (s1 - s0) * t);
    const x = cx + rx * r * sgn(c) * Math.abs(c) ** 0.77 + wobble * 0.8 * Math.sin(th * 1.7 + p3);
    let y = cy + ry * r * sgn(s) * Math.abs(s) ** 0.77 + tilt * (cx + rx * r * c - cx) + wobble * 0.8 * Math.sin(th * 2.3 + p1);
    if (x > -1 && x < w + 1 && Math.abs(y - cy) < 10.5) y = cy + (y >= cy ? 10.5 : -10.5);
    pts.push([x, Math.max(cy - 18, Math.min(cy + 18, y))]);
  }
  // The lead-in: from the menu's right side, along the top of the row (above the scribble, below the row above), to the
  // ring's first point, arriving in the direction the ring goes.
  const [P0, P1] = pts;
  const tl0 = dist(P0, P1) || 1;
  const sx = Math.min(maxX - 4, w + 43 + rand() * 30);
  const sy = Math.max(cy - 19, cy - 15 - rand() * 4);
  const reach = Math.max(10, sx - P0[0]);
  let d = `M${pt(sx, sy)} C${pt(sx - reach * 0.4, sy + (rand() - 0.5) * 7)} ${pt(P0[0] - ((P1[0] - P0[0]) / tl0) * reach * 0.35, P0[1] - ((P1[1] - P0[1]) / tl0) * reach * 0.35 + (rand() - 0.5) * 4)} ${pt(P0[0], P0[1])}`;
  d += pts.slice(1).map(([x, y]) => ` L${pt(x, y)}`).join("");
  let length = dist([sx, sy], P0) * 1.08;
  for (let j = 1; j < pts.length; j++) length += dist(pts[j - 1], pts[j]);
  const P = pts[pts.length - 1];
  const Q = pts[pts.length - 2];
  const tl = dist(P, Q) || 1;
  const E: [number, number] = [w + 9, cy + 5];
  d += ` C${pt(P[0] + ((P[0] - Q[0]) / tl) * 8, P[1] + ((P[1] - Q[1]) / tl) * 8)} ${pt(E[0] - 8, E[1])} ${pt(E[0], E[1])}`;
  length += dist(P, E) * 1.05;
  return { d, length, E, startX: Math.min(-9, sx) };
}

/** The end of the open page's line: a small circle drawn by hand, in the same hand as the scribble's loops. The pen comes
 * up out of the line, goes round once and a bit (so the end crosses the start), a little leaning to the right like the
 * italic, never quite round and never the same twice, and leaves with a short flick to the right. Starts at the line's
 * end (rx, ry), heading right. */
function circle(rand: () => number, rx: number, ry: number): string {
  const r0 = 4.2 + rand() * 1.3;
  const turns = 1.12 + rand() * 0.2;
  const steps = Math.round(turns * 40);
  const squash = 0.88 + rand() * 0.25;
  const lean = 0.25 + rand() * 0.3;
  const [p1, p2] = [rand() * TAU, rand() * TAU];
  const pts: [number, number][] = [];
  for (let j = 1; j <= steps; j++) {
    const t = j / steps;
    const th = Math.PI / 2 - TAU * turns * t;
    const r = r0 * (1 - 0.1 * t) * (1 + 0.05 * Math.sin(2 * th + p1) + 0.03 * Math.sin(3 * th + p2));
    const y = ry - r0 + r * Math.sin(th);
    pts.push([rx + r * squash * Math.cos(th) + lean * 0.5 * (ry - y), y]);
  }
  const [P, Q] = [pts[pts.length - 1], pts[pts.length - 2]];
  const tl = dist(P, Q) || 1;
  const flick = 6 + rand() * 4;
  return (
    pts.map(([x, y]) => ` L${pt(x, y)}`).join("") +
    ` C${pt(P[0] + ((P[0] - Q[0]) / tl) * 4, P[1] + ((P[1] - Q[1]) / tl) * 4)} ${pt(P[0] + flick * 0.6, P[1] - 1 + rand() * 2)} ${pt(P[0] + flick, P[1] + (rand() - 0.5) * 2)}`
  );
}

/** The end of a pointed-at page's line: the pen goes on to a tip, then flicks back along one wing, returns, and flicks
 * back along the other. The wings are slightly curved and their lengths, and the tip, are a little different each time. */
function arrow(rand: () => number, rx: number, ry: number): string {
  const shaft = 6.5 + rand() * 1.5;
  const tx = rx + shaft;
  const ty = ry + (rand() - 0.5);
  const w1 = 0.9 + rand() * 0.35;
  const w2 = 0.9 + rand() * 0.35;
  return (
    ` C${pt(rx + shaft * 0.4, ry)} ${pt(rx + shaft * 0.7, (ry + ty) / 2)} ${pt(tx, ty)}` +
    ` C${pt(tx - 2, ty - 1)} ${pt(tx - 4, ty - 2.5 * w1)} ${pt(tx - 6.3 * w1, ty - 6 * w1)}` +
    ` C${pt(tx - 4, ty - 2.5 * w1)} ${pt(tx - 2, ty - 1)} ${pt(tx, ty)}` +
    ` C${pt(tx - 2, ty + 1.2)} ${pt(tx - 4, ty + 2.8 * w2)} ${pt(tx - 6.6 * w2, ty + 6.5 * w2)}`
  );
}

interface Ink {
  /** The whole line as it is on the open page: ends in a hand-drawn circle. */
  on: string;
  /** The whole line as it is on a page that is pointed at: ends in a hand-drawn arrowhead. */
  hover: string;
  /** A second, fainter line under a short part of the scribble, in a different place each time: its ghost. */
  ghost: string;
  /** How far along the main line (in px) the ghost's part begins, so it can be written just behind the pen. */
  ghostAt: number;
  /** Where the line itself ends (for the colour that runs along it). */
  endX: number;
  /** Where it begins. */
  startX: number;
}

/** One continuous line, in pixels, from the page's own measurements: it comes in from the menu's right side, goes round the
 * word in a rough marker circle, whose last stroke carries on into a cursive scribble, then a loop and a short tail, and
 * last a hand-drawn circle (open page) or an
 * arrowhead (pointed at) that the pen draws too. Each is one path, so it is drawn at one pace and has no seams. `w` and
 * `h` are the size of the word, `maxX` how far right the line may reach, all in pixels from the word's top left corner.
 * `seed` decides everything that is different each time: the marker, the ghost's place, the end circle and the arrowhead. */
function build(index: number, w: number, h: number, maxX: number, seed: number): Ink {
  const k = index % LOOPS.length;
  const rand = random(seed);
  const cy = h / 2;

  const ring = marker(rand, w, cy, maxX);
  const [ex, ey] = ring.E;

  // The scribble: a chain of slanted loops that starts and ends on the baseline and swells between, so it joins the
  // ring and the loop without a kink. It takes the room there is, between a minimum and a maximum.
  const loopScale = LOOP_SCALE[k];
  const tail = TAILS[(k + 3) % TAILS.length];
  const room = maxX - ex - 27 * loopScale - tail.w - 14;
  const length = Math.max(50, Math.min(130, room));
  const n = LOOPS[k];
  const a = length / (TAU * n);
  const count = n * 44;
  const scribble: [number, number][] = [];
  for (let j = 1; j <= count; j++) {
    const s = j / count;
    const u = TAU * n * s;
    const swell = Math.pow(Math.sin(Math.PI * s), 0.7);
    const y = ey - swell * (RISE[k] / 2) * (1 - Math.cos(u));
    scribble.push([ex + a * u + CURL[k] * a * swell * Math.sin(u) + LEAN[k] * (ey - y), y]);
  }
  const body = ring.d + scribble.map(([x, y]) => ` L${pt(x, y)}`).join("");

  // The loop and the tail, one after the other, each starting where the one before ended.
  const sx = ex + length;
  const lx = sx + 27 * loopScale;
  const ly = ey - 2 * loopScale;
  const line = `${body} ${place(LOOP, 0, 11, sx, ey, loopScale)} ${place(tail.d, 0, 5, lx, ly)}`;
  const rx = lx + tail.w;
  const ry = ly;

  // The ghost: a stretch of the scribble (a third to a half of it) again, 1.5px right and 3px lower, as a separate,
  // thinner, fainter line. Where along the scribble it is changes every time.
  const span = Math.round(scribble.length * (0.32 + rand() * 0.18));
  const from = Math.round(rand() * (scribble.length - span));
  const part = scribble.slice(from, from + span + 1);
  const ghost = `M${pt(part[0][0] + 1.5, part[0][1] + 3)}${part.slice(1).map(([x, y]) => ` L${pt(x + 1.5, y + 3)}`).join("")}`;
  let ghostAt = ring.length + dist(ring.E, scribble[0]);
  for (let j = 1; j <= from; j++) ghostAt += dist(scribble[j - 1], scribble[j]);

  return { on: line + circle(rand, rx, ry), hover: line + arrow(rand, rx, ry), ghost, ghostAt, endX: rx + 8, startX: ring.startX };
}

/** The pace the line is written at (px per second) on the open page and on a page that is pointed at. */
const PACE_ON = 340;
const PACE_HV = 520;
const secs = (n: number) => `${n.toFixed(2)}s`;

/** The line that is written out beside the open page's name and the name of a page that is pointed at (see `.nav-ink` in
 * sidebar-card.css for how it is drawn and timed). It measures the word it sits on, so the circle fits it and the
 * scribble takes the room that is left. A new line is dealt, with a new marker circle, each time the row stops being
 * the open page or stops being pointed at, so every time it is written out it is different. Put it inside the word's
 * box, which must be positioned. */
export function NavInk({ index }: { index: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onRef = useRef<SVGPathElement>(null);
  const hoverRef = useRef<SVGPathElement>(null);
  const ghostRef = useRef<SVGPathElement>(null);
  const gradient = useId();
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const [ink, setInk] = useState<(Ink & { h: number; maxX: number }) | null>(null);
  const [lengths, setLengths] = useState({ on: 0, hover: 0, ghost: 0 });

  useLayoutEffect(() => {
    const word = svgRef.current?.parentElement;
    const row = word?.closest("a");
    if (!word || !row) return;
    const measure = () => {
      const w = word.offsetWidth;
      const h = word.offsetHeight;
      if (!w || !h) return;
      const left = word.getBoundingClientRect().left - row.getBoundingClientRect().left;
      // The line may run on 14px past the row, into the card's padding.
      const maxX = row.clientWidth + 14 - left;
      setInk({ ...build(index, w, h, maxX, seed), h, maxX });
    };
    measure();
    const watcher = new ResizeObserver(measure);
    watcher.observe(word);
    watcher.observe(row);
    // The next time the line is written out it is a new one: deal it as soon as this one is no longer showing.
    const deal = () => setSeed(Math.floor(Math.random() * 2 ** 31));
    row.addEventListener("mouseleave", deal);
    const changes = new MutationObserver(deal);
    changes.observe(row, { attributes: true, attributeFilter: ["aria-current"] });
    return () => {
      watcher.disconnect();
      changes.disconnect();
      row.removeEventListener("mouseleave", deal);
    };
  }, [index, seed]);

  useLayoutEffect(() => {
    if (!ink || !onRef.current || !hoverRef.current || !ghostRef.current) return;
    setLengths({ on: onRef.current.getTotalLength(), hover: hoverRef.current.getTotalLength(), ghost: ghostRef.current.getTotalLength() });
  }, [ink]);

  const style = (len: number, pace: number) => ({ "--len": len, "--dur": secs(len / pace) }) as CSSProperties;
  // The ghost starts a moment after the pen has got to where it begins, and goes at the same pace.
  const ghostAt = ink?.ghostAt ?? 0;
  const ghostStyle = {
    "--glen": lengths.ghost,
    "--gdur-on": secs(lengths.ghost / PACE_ON),
    "--gdur-hv": secs(lengths.ghost / PACE_HV),
    "--gdelay-on": secs(ghostAt / PACE_ON + 0.1),
    "--gdelay-hv": secs(ghostAt / PACE_HV + 0.08),
  } as CSSProperties;

  return (
    <svg ref={svgRef} className="nav-ink" width={ink?.maxX ?? 0} height={ink?.h ?? 0} style={ghostStyle} aria-hidden="true">
      {ink && (
        <>
          <defs>
            <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1={ink.startX} x2={ink.endX} y1={0} y2={0}>
              {[0, 25, 50, 75, 100].map((at) => (
                <stop key={at} offset={at / 100} className={`nav-stop-${at}`} />
              ))}
            </linearGradient>
          </defs>
          <path ref={ghostRef} className="nav-ghost" d={ink.ghost} />
          <path ref={onRef} className="nav-main nav-main-on" d={ink.on} stroke={`url(#${gradient})`} style={style(lengths.on, PACE_ON)} />
          <path ref={hoverRef} className="nav-main nav-main-hv" d={ink.hover} stroke={`url(#${gradient})`} style={style(lengths.hover, PACE_HV)} />
        </>
      )}
    </svg>
  );
}

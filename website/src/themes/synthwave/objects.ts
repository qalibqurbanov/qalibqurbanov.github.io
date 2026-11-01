import { project, rotate, type Vec3 } from "../shared/scene/geometry";
import type { Rgb } from "../shared/scene/types";
import { mix, rgba } from "../shared/scene/util";
import type { Kind } from "../shared/scene/world";

const TAU = Math.PI * 2;
const NIGHT: Rgb = [14, 5, 34];

/** One neon tube: a wide soft halo, a bright body, and a near-white core, all on `lighter`. */
function tube(g: CanvasRenderingContext2D, path: () => void, color: Rgb, a: number, width = 3) {
  g.save();
  g.globalCompositeOperation = "lighter";
  g.lineCap = "round";
  g.lineJoin = "round";
  path();
  g.strokeStyle = rgba(color, a * 0.12);
  g.lineWidth = width * 7;
  g.stroke();
  path();
  g.strokeStyle = rgba(color, a * 0.3);
  g.lineWidth = width * 3;
  g.stroke();
  path();
  g.strokeStyle = rgba(mix(color, [255, 245, 255], 0.55), a * 0.95);
  g.lineWidth = width * 0.8;
  g.stroke();
  g.restore();
}

/** A closed polygon as a path. */
function poly(g: CanvasRenderingContext2D, pts: [number, number][]) {
  g.beginPath();
  pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
  g.closePath();
}

/** The two neon colours of the style, picked per object. */
function pair(e: { accent: Rgb; accent2: Rgb }, tone: number): [Rgb, Rgb] {
  return tone < 0.5 ? [e.accent, e.accent2] : [e.accent2, e.accent];
}

// ---------------------------------------------------------------------------------------------
// Palm tree: the silhouette of every outrun poster. A dark curved trunk and drooping fronds,
// rim-lit in neon on one side and swaying very gently.
// ---------------------------------------------------------------------------------------------

interface Palm {
  lean: number;
  tone: number;
  ph: number;
  fronds: number[];
}

const palm: Kind<Palm> = {
  id: "palm",
  weight: 3,
  radius: [90, 150],
  depth: [0.85, 1],
  zone: "edge",
  reach: 1.3,
  make: (rnd) => ({ lean: (rnd() < 0.5 ? -1 : 1) * (0.12 + rnd() * 0.22), tone: rnd(), ph: rnd() * TAU, fronds: Array.from({ length: 9 }, () => 0.85 + rnd() * 0.3) }),
  draw(g, s, e, x, y, r, a) {
    const [hot, cool] = pair(e, s.tone);
    const sway = Math.sin(e.t * 0.7 + s.ph) * 0.03;
    const baseY = y + r;
    const topX = x + (s.lean + sway) * r;
    const topY = y - r * 0.7;
    const body = mix(e.light ? ([40, 14, 70] as Rgb) : NIGHT, hot, 0.2);
    g.save();
    // trunk: a tapering curve
    const bend = s.lean * r * 0.55;
    g.beginPath();
    g.moveTo(x - r * 0.07, baseY);
    g.quadraticCurveTo(x + bend - r * 0.05, (baseY + topY) / 2, topX - r * 0.03, topY);
    g.lineTo(topX + r * 0.03, topY);
    g.quadraticCurveTo(x + bend + r * 0.05, (baseY + topY) / 2, x + r * 0.07, baseY);
    g.closePath();
    g.fillStyle = rgba(body, 0.97 * a);
    g.fill();
    // rings on the trunk
    g.strokeStyle = rgba(hot, 0.35 * a);
    g.lineWidth = 1;
    for (let i = 1; i < 9; i++) {
      const t = i / 9;
      const px = x + (topX - x) * t * t + bend * 0.15 * Math.sin(t * Math.PI);
      const py = baseY + (topY - baseY) * t;
      const half = r * (0.075 - 0.04 * t);
      g.beginPath();
      g.moveTo(px - half, py);
      g.lineTo(px + half, py + half * 0.35);
      g.stroke();
    }
    // fronds, each a curved blade that arches up and droops
    const rims: number[][] = [];
    for (let i = 0; i < s.fronds.length; i++) {
      const spread = -Math.PI * 0.98 + (i / (s.fronds.length - 1)) * Math.PI * 0.96;
      const len = r * 0.95 * s.fronds[i];
      const wave = Math.sin(e.t * 0.9 + s.ph + i) * 0.04;
      const ang = spread + wave;
      const rise = Math.sin(-ang) * 0.35;
      const ex = topX + Math.cos(ang) * len;
      const ey = topY + Math.sin(ang) * len * 0.45 + len * 0.42;
      const cx = topX + Math.cos(ang) * len * 0.55;
      const cy = topY + Math.sin(ang) * len * 0.55 - len * (0.25 + rise * 0.4);
      const w = r * 0.11;
      g.beginPath();
      g.moveTo(topX, topY);
      g.quadraticCurveTo(cx, cy - w, ex, ey);
      g.quadraticCurveTo(cx, cy + w * 1.7, topX, topY);
      g.fillStyle = rgba(body, 0.97 * a);
      g.fill();
      rims.push([topX, topY, cx, cy - w, ex, ey, spread < -Math.PI / 2 ? 0 : 1]);
    }
    // the neon rim along the upper edge of every frond, in one glowing pass per colour
    for (const side of [0, 1]) {
      tube(
        g,
        () => {
          g.beginPath();
          for (const [x0, y0, qx, qy, x1, y1, sd] of rims) {
            if (sd !== side) continue;
            g.moveTo(x0, y0);
            g.quadraticCurveTo(qx, qy, x1, y1);
          }
        },
        side ? cool : hot,
        a * 0.9,
        1.1,
      );
    }
    g.restore();
    // a soft glow where the crown catches the sunset
    g.save();
    g.globalCompositeOperation = "lighter";
    const glow = g.createRadialGradient(topX, topY, 0, topX, topY, r * 0.9);
    glow.addColorStop(0, rgba(hot, 0.16 * a));
    glow.addColorStop(1, rgba(hot, 0));
    g.fillStyle = glow;
    g.fillRect(topX - r, topY - r, r * 2, r * 2);
    g.restore();
  },
};

// ---------------------------------------------------------------------------------------------
// Wireframe solids: a pyramid and a diamond turning slowly, drawn as neon tubes with a faint
// gradient in their faces, like the vector graphics of an eighties computer.
// ---------------------------------------------------------------------------------------------

interface Wire {
  tone: number;
  ph: number;
  tilt: number;
  spin: number;
}

function wireSolid(id: string, verts: Vec3[], edges: [number, number][], faces: number[][], radius: [number, number], weight: number): Kind<Wire> {
  return {
    id,
    weight,
    radius,
    depth: [0.8, 1],
    zone: "side",
    reach: 1.45,
    make: (rnd) => ({ tone: rnd(), ph: rnd() * TAU, tilt: 0.3 + rnd() * 0.35, spin: (rnd() < 0.5 ? -1 : 1) * (0.25 + rnd() * 0.25) }),
    draw(g, s, e, x, y, r, a) {
      const [hot, cool] = pair(e, s.tone);
      const yaw = e.t * s.spin + s.ph;
      const pts = verts.map((v) => project(rotate(v, s.tilt, yaw), x, y, r, 0.12));
      // faint faces, the back ones first
      const order = faces
        .map((f) => ({ f, z: f.reduce((sum, i) => sum + pts[i][2], 0) / f.length }))
        .sort((p, q) => q.z - p.z);
      g.save();
      for (const { f, z } of order) {
        poly(g, f.map((i) => [pts[i][0], pts[i][1]]));
        const gr = g.createLinearGradient(x, y - r, x, y + r);
        gr.addColorStop(0, rgba(hot, z > 0 ? 0.05 : 0.14));
        gr.addColorStop(1, rgba(cool, z > 0 ? 0.04 : 0.1));
        g.fillStyle = gr;
        g.globalAlpha = a;
        g.fill();
      }
      g.restore();
      tube(
        g,
        () => {
          g.beginPath();
          for (const [i, j] of edges) {
            g.moveTo(pts[i][0], pts[i][1]);
            g.lineTo(pts[j][0], pts[j][1]);
          }
        },
        hot,
        a,
        1.8,
      );
      // the vertices glow a little brighter than the edges
      g.save();
      g.globalCompositeOperation = "lighter";
      for (const p of pts) {
        g.fillStyle = rgba(mix(cool, [255, 255, 255], 0.6), a * 0.9);
        g.beginPath();
        g.arc(p[0], p[1], 2, 0, TAU);
        g.fill();
      }
      g.restore();
    },
  };
}

const PYRAMID_V: Vec3[] = [
  [0, -1, 0],
  [-0.85, 0.6, -0.85],
  [0.85, 0.6, -0.85],
  [0.85, 0.6, 0.85],
  [-0.85, 0.6, 0.85],
];
const pyramid = wireSolid(
  "pyramid",
  PYRAMID_V,
  [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 3], [3, 4], [4, 1]],
  [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [1, 2, 3, 4]],
  [60, 110],
  2,
);

const DIAMOND_V: Vec3[] = [
  [0, -1.1, 0],
  [0, 1.1, 0],
  [0.8, 0, 0],
  [-0.8, 0, 0],
  [0, 0, 0.8],
  [0, 0, -0.8],
];
const diamond = wireSolid(
  "diamond",
  DIAMOND_V,
  [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 4], [4, 3], [3, 5], [5, 2]],
  [[0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2], [1, 2, 4], [1, 4, 3], [1, 3, 5], [1, 5, 2]],
  [50, 90],
  2,
);

// ---------------------------------------------------------------------------------------------
// Neon triangle: nested outlines of an equilateral triangle, the emblem of the genre's covers,
// with a slow pulse that runs from the outside in.
// ---------------------------------------------------------------------------------------------

interface Tri {
  tone: number;
  ph: number;
  rot: number;
}

const triangle: Kind<Tri> = {
  id: "triangle",
  weight: 2,
  radius: [60, 110],
  depth: [0.8, 1],
  zone: "side",
  reach: 1.3,
  make: (rnd) => ({ tone: rnd(), ph: rnd() * TAU, rot: (rnd() - 0.5) * 0.3 }),
  draw(g, s, e, x, y, r, a) {
    const [hot, cool] = pair(e, s.tone);
    for (let i = 0; i < 3; i++) {
      const k = 1 - i * 0.27;
      const pulse = 0.55 + 0.45 * Math.sin(e.t * 1.4 - i * 0.9 + s.ph);
      const pts: [number, number][] = [0, 1, 2].map((v) => {
        const ang = -Math.PI / 2 + v * (TAU / 3) + s.rot;
        return [x + Math.cos(ang) * r * k, y + Math.sin(ang) * r * k + r * 0.12];
      });
      tube(g, () => poly(g, pts), i % 2 ? cool : hot, a * (0.4 + pulse * 0.6), 2.2 - i * 0.4);
    }
  },
};

// ---------------------------------------------------------------------------------------------
// Cassette tape and VHS tape: the media of the decade, as neon outlines with turning reels.
// ---------------------------------------------------------------------------------------------

interface Media {
  tone: number;
  ph: number;
  rot: number;
}

function reel(g: CanvasRenderingContext2D, cx: number, cy: number, rad: number, ang: number, color: Rgb, a: number) {
  g.save();
  g.translate(cx, cy);
  g.rotate(ang);
  tube(g, () => {
    g.beginPath();
    g.arc(0, 0, rad, 0, TAU);
  }, color, a, 1.4);
  g.strokeStyle = rgba([255, 240, 252], a * 0.8);
  g.lineWidth = 1.4;
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * TAU;
    g.moveTo(Math.cos(t) * rad * 0.35, Math.sin(t) * rad * 0.35);
    g.lineTo(Math.cos(t) * rad * 0.8, Math.sin(t) * rad * 0.8);
  }
  g.stroke();
  g.restore();
}

const cassette: Kind<Media> = {
  id: "cassette",
  weight: 3,
  radius: [60, 100],
  depth: [0.8, 1],
  zone: "side",
  reach: 1.4,
  make: (rnd) => ({ tone: rnd(), ph: rnd() * TAU, rot: (rnd() - 0.5) * 0.5 }),
  draw(g, s, e, x, y, r, a) {
    const [hot, cool] = pair(e, s.tone);
    const w = r * 1.7;
    const h = r * 1.1;
    g.save();
    g.translate(x, y);
    g.rotate(s.rot);
    g.beginPath();
    g.roundRect(-w / 2, -h / 2, w, h, r * 0.08);
    g.fillStyle = rgba(NIGHT, 0.88 * a);
    g.fill();
    tube(g, () => {
      g.beginPath();
      g.roundRect(-w / 2, -h / 2, w, h, r * 0.08);
    }, hot, a, 1.8);
    // the label, with two coloured bands
    g.fillStyle = rgba(cool, 0.14 * a);
    g.fillRect(-w * 0.43, -h * 0.4, w * 0.86, h * 0.42);
    g.fillStyle = rgba(hot, 0.65 * a);
    g.fillRect(-w * 0.43, -h * 0.4, w * 0.86, h * 0.07);
    g.fillStyle = rgba(cool, 0.65 * a);
    g.fillRect(-w * 0.43, -h * 0.33, w * 0.86, h * 0.04);
    // the window with its two reels
    g.beginPath();
    g.roundRect(-w * 0.3, h * 0.02, w * 0.6, h * 0.28, h * 0.14);
    g.strokeStyle = rgba(cool, 0.7 * a);
    g.lineWidth = 1.2;
    g.stroke();
    const turn = e.t * 1.6 + s.ph;
    reel(g, -w * 0.16, h * 0.16, h * 0.11, turn, cool, a);
    reel(g, w * 0.16, h * 0.16, h * 0.11, turn, cool, a);
    // the bottom edge with its screws
    g.fillStyle = rgba(hot, 0.5 * a);
    for (const sx of [-0.4, 0.4]) {
      g.beginPath();
      g.arc(w * sx, h * 0.4, r * 0.025, 0, TAU);
      g.fill();
    }
    g.restore();
  },
};

const vhs: Kind<Media> = {
  id: "vhs",
  weight: 3,
  radius: [60, 100],
  depth: [0.8, 1],
  zone: "side",
  reach: 1.4,
  make: (rnd) => ({ tone: rnd(), ph: rnd() * TAU, rot: (rnd() - 0.5) * 0.5 }),
  draw(g, s, e, x, y, r, a) {
    const [hot, cool] = pair(e, s.tone);
    const w = r * 1.9;
    const h = r * 1.05;
    g.save();
    g.translate(x, y);
    g.rotate(s.rot);
    g.beginPath();
    g.roundRect(-w / 2, -h / 2, w, h, r * 0.05);
    g.fillStyle = rgba(NIGHT, 0.9 * a);
    g.fill();
    tube(g, () => {
      g.beginPath();
      g.roundRect(-w / 2, -h / 2, w, h, r * 0.05);
    }, cool, a, 1.8);
    // the label: a hot strip with the three letters on it
    g.fillStyle = rgba(hot, 0.22 * a);
    g.fillRect(-w * 0.44, -h * 0.42, w * 0.88, h * 0.36);
    g.strokeStyle = rgba(hot, 0.8 * a);
    g.lineWidth = 1.1;
    g.strokeRect(-w * 0.44, -h * 0.42, w * 0.88, h * 0.36);
    g.font = `800 ${(h * 0.3).toFixed(1)}px "Orbitron", "Rajdhani", sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = rgba(mix(hot, [255, 240, 250], 0.55), 0.95 * a);
    g.fillText("VHS", 0, -h * 0.24);
    // the tape window with two reels, and the spring-loaded flap beneath it
    g.strokeStyle = rgba(cool, 0.7 * a);
    g.beginPath();
    g.roundRect(-w * 0.34, 0, w * 0.68, h * 0.3, h * 0.12);
    g.stroke();
    const turn = e.t * 1.2 + s.ph;
    reel(g, -w * 0.17, h * 0.15, h * 0.1, turn, cool, a);
    reel(g, w * 0.17, h * 0.15, h * 0.1, -turn, cool, a);
    g.fillStyle = rgba(hot, 0.5 * a);
    g.fillRect(-w * 0.2, h * 0.38, w * 0.4, h * 0.05);
    g.restore();
  },
};

// ---------------------------------------------------------------------------------------------
// Arcade cabinet: a dark cabinet with a glowing marquee, a screen playing a little invader, a
// control deck with a joystick and buttons, and a floor glow.
// ---------------------------------------------------------------------------------------------

interface Arcade {
  tone: number;
  ph: number;
  rot: number;
}

const INVADER = ["00100000100", "00010001000", "00111111100", "01101110110", "11111111111", "10111111101", "10100000101", "00011011000"];

const arcade: Kind<Arcade> = {
  id: "arcade",
  weight: 2,
  radius: [80, 130],
  depth: [0.85, 1],
  zone: "edge",
  reach: 1.3,
  make: (rnd) => ({ tone: rnd(), ph: rnd() * TAU, rot: (rnd() - 0.5) * 0.1 }),
  draw(g, s, e, x, y, r, a) {
    const [hot, cool] = pair(e, s.tone);
    const w = r * 1.05;
    const h = r * 2;
    g.save();
    g.translate(x, y);
    g.rotate(s.rot);
    // the cabinet: a tall box with a slanted screen section and a deeper control deck
    const outline: [number, number][] = [
      [-w / 2, h / 2],
      [-w / 2, -h * 0.5],
      [w / 2, -h * 0.5],
      [w / 2, h * 0.08],
      [w * 0.62, h * 0.12],
      [w * 0.62, h * 0.22],
      [w / 2, h * 0.24],
      [w / 2, h / 2],
    ];
    poly(g, outline);
    g.fillStyle = rgba(NIGHT, 0.95 * a);
    g.fill();
    tube(g, () => poly(g, outline), hot, a, 1.6);
    // the marquee
    const flick = 0.85 + 0.15 * Math.sin(e.t * 3 + s.ph);
    g.fillStyle = rgba(cool, 0.35 * a * flick);
    g.fillRect(-w * 0.42, -h * 0.47, w * 0.84, h * 0.07);
    g.strokeStyle = rgba(cool, 0.9 * a);
    g.lineWidth = 1;
    g.strokeRect(-w * 0.42, -h * 0.47, w * 0.84, h * 0.07);
    // the screen
    const sx = -w * 0.4;
    const sy = -h * 0.36;
    const sw = w * 0.8;
    const sh = h * 0.4;
    const scr = g.createLinearGradient(0, sy, 0, sy + sh);
    scr.addColorStop(0, rgba(mix(cool, [10, 5, 30], 0.55), 0.95 * a));
    scr.addColorStop(1, rgba(mix(hot, [10, 5, 30], 0.6), 0.95 * a));
    g.fillStyle = scr;
    g.fillRect(sx, sy, sw, sh);
    g.strokeStyle = rgba(mix(cool, [255, 255, 255], 0.4), 0.9 * a);
    g.strokeRect(sx, sy, sw, sh);
    // the little invader, stepping from side to side
    const px = (sw * 0.7) / INVADER[0].length;
    const ox = sx + sw * 0.15 + Math.sin(e.t * 0.8 + s.ph) * sw * 0.08;
    const oy = sy + sh * 0.2 + (Math.floor(e.t * 1.5 + s.ph) % 2) * px * 0.6;
    g.fillStyle = rgba([240, 255, 230], 0.9 * a);
    INVADER.forEach((row, ry) =>
      [...row].forEach((c, cx) => {
        if (c === "1") g.fillRect(ox + cx * px, oy + ry * px, px * 0.9, px * 0.9);
      }),
    );
    // the control deck: a joystick and two buttons
    g.strokeStyle = rgba(hot, 0.9 * a);
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-w * 0.22, h * 0.17);
    g.lineTo(-w * 0.22 + Math.sin(e.t * 0.9 + s.ph) * w * 0.03, h * 0.1);
    g.stroke();
    g.fillStyle = rgba(hot, 0.95 * a);
    g.beginPath();
    g.arc(-w * 0.22 + Math.sin(e.t * 0.9 + s.ph) * w * 0.03, h * 0.095, w * 0.04, 0, TAU);
    g.fill();
    for (const [bx, color] of [[w * 0.08, cool], [w * 0.24, hot]] as [number, Rgb][]) {
      g.fillStyle = rgba(color, 0.9 * a);
      g.beginPath();
      g.arc(bx, h * 0.17, w * 0.04, 0, TAU);
      g.fill();
    }
    // the coin slot and the kick plate
    g.fillStyle = rgba(cool, 0.5 * a);
    g.fillRect(-w * 0.1, h * 0.32, w * 0.2, h * 0.025);
    g.restore();
    // glow on the floor around its feet
    g.save();
    g.globalCompositeOperation = "lighter";
    const floor = g.createRadialGradient(x, y + h / 2, 0, x, y + h / 2, r * 1.2);
    floor.addColorStop(0, rgba(hot, 0.28 * a));
    floor.addColorStop(1, rgba(hot, 0));
    g.fillStyle = floor;
    g.fillRect(x - r * 1.3, y + h / 2 - r * 0.5, r * 2.6, r);
    g.restore();
  },
};

// ---------------------------------------------------------------------------------------------
// Aviator sunglasses: two tinted lenses with a sunset in them, bobbing slightly.
// ---------------------------------------------------------------------------------------------

interface Shades {
  tone: number;
  ph: number;
  rot: number;
}

const shades: Kind<Shades> = {
  id: "shades",
  weight: 2,
  radius: [60, 100],
  depth: [0.8, 1],
  zone: "side",
  reach: 1.4,
  make: (rnd) => ({ tone: rnd(), ph: rnd() * TAU, rot: (rnd() - 0.5) * 0.35 }),
  draw(g, s, e, x, y, r, a) {
    const [hot, cool] = pair(e, s.tone);
    const bob = Math.sin(e.t * 0.9 + s.ph) * r * 0.03;
    g.save();
    g.translate(x, y + bob);
    g.rotate(s.rot);
    const lens = (side: number) => {
      const cx = side * r * 0.5;
      g.beginPath();
      g.moveTo(cx - r * 0.44, -r * 0.2);
      g.quadraticCurveTo(cx, -r * 0.27, cx + r * 0.44, -r * 0.2);
      g.quadraticCurveTo(cx + r * 0.46, r * 0.38, cx, r * 0.46);
      g.quadraticCurveTo(cx - r * 0.46, r * 0.38, cx - r * 0.44, -r * 0.2);
      g.closePath();
    };
    for (const side of [-1, 1]) {
      lens(side);
      const sun = g.createLinearGradient(0, -r * 0.25, 0, r * 0.46);
      sun.addColorStop(0, rgba(mix(hot, NIGHT, 0.35), 0.95 * a));
      sun.addColorStop(0.5, rgba(mix(hot, [255, 170, 80], 0.5), 0.9 * a));
      sun.addColorStop(1, rgba(mix(cool, NIGHT, 0.55), 0.95 * a));
      g.fillStyle = sun;
      g.fill();
      // the glint
      g.save();
      lens(side);
      g.clip();
      g.fillStyle = rgba([255, 255, 255], 0.35 * a);
      const glint = ((e.t * 0.25 + s.ph) % 3) * r * 1.2 - r * 0.9;
      g.translate(side * r * 0.5 + glint * 0.2, 0);
      g.rotate(-0.5);
      g.fillRect(-r * 0.05, -r * 0.5, r * 0.09, r);
      g.restore();
    }
    tube(g, () => {
      lens(-1);
      lens(1);
    }, hot, a, 1.6);
    // the bridge and the arms
    tube(g, () => {
      g.beginPath();
      g.moveTo(-r * 0.08, -r * 0.14);
      g.quadraticCurveTo(0, -r * 0.24, r * 0.08, -r * 0.14);
      g.moveTo(-r * 0.94, -r * 0.16);
      g.lineTo(-r * 1.12, -r * 0.06);
      g.moveTo(r * 0.94, -r * 0.16);
      g.lineTo(r * 1.12, -r * 0.06);
    }, cool, a, 1.4);
    g.restore();
  },
};

// ---------------------------------------------------------------------------------------------
// Lightning bolt: a hard neon zig-zag that hums, with the odd faint flicker of its glow.
// ---------------------------------------------------------------------------------------------

interface Bolt {
  tone: number;
  ph: number;
  rot: number;
}

const bolt: Kind<Bolt> = {
  id: "bolt",
  weight: 2,
  radius: [60, 100],
  depth: [0.8, 1],
  zone: "side",
  reach: 1.3,
  make: (rnd) => ({ tone: rnd(), ph: rnd() * TAU, rot: (rnd() - 0.5) * 0.4 }),
  draw(g, s, e, x, y, r, a) {
    const [hot, cool] = pair(e, s.tone);
    const hum = 0.85 + 0.15 * Math.sin(e.t * 9 + s.ph) * Math.sin(e.t * 1.3 + s.ph);
    g.save();
    g.translate(x, y);
    g.rotate(s.rot);
    const shape: [number, number][] = [
      [r * 0.18, -r],
      [-r * 0.5, r * 0.1],
      [-r * 0.04, r * 0.1],
      [-r * 0.2, r],
      [r * 0.5, -r * 0.18],
      [r * 0.04, -r * 0.18],
    ];
    poly(g, shape);
    g.fillStyle = rgba(mix(hot, NIGHT, 0.7), 0.5 * a);
    g.fill();
    tube(g, () => poly(g, shape), hot, a * hum, 2.2);
    g.save();
    g.scale(0.62, 0.62);
    tube(g, () => poly(g, shape), cool, a * 0.55 * hum, 1.2);
    g.restore();
    g.restore();
  },
};

/** What floats through the synthwave pages: the things of an outrun poster, drawn in neon. The sun,
 * grid, mountains, skyline and road are the backdrop (scene.ts, road.ts, skyline.ts). */
export const kinds: Kind[] = [palm, pyramid, diamond, triangle, cassette, vhs, arcade, shades, bolt] as Kind[];

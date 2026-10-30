import type { Rgb } from "../shared/scene/types";
import { mix, rgba } from "../shared/scene/util";
import type { Kind } from "../shared/scene/world";

const TAU = Math.PI * 2;
const marble = (light: boolean): Rgb => (light ? [238, 230, 246] : [234, 226, 248]);

// ---------------------------------------------------------------------------------------------
// Marble bust: a classical head and shoulders in profile on a plinth, in white marble lit from the
// upper left and rimmed in cool light on the shadow side. It turns a few degrees one way and back and
// rises and sinks a little, as if on slow air. In place of the sculptor's finish, fine veins run
// through the stone.
// ---------------------------------------------------------------------------------------------

interface Bust {
  ph: number;
  flip: number;
  veins: [number, number, number, number][];
}

function bustPath(g: CanvasRenderingContext2D, s: number) {
  const p = (x: number, y: number): [number, number] => [x * s, y * s];
  g.beginPath();
  g.moveTo(...p(-0.34, 1.34));
  g.lineTo(...p(-0.28, 0.84));
  g.bezierCurveTo(...p(-0.5, 0.58), ...p(-0.54, 0.02), ...p(-0.2, -0.04));
  g.bezierCurveTo(...p(0.12, -0.12), ...p(0.34, 0.04), ...p(0.36, 0.3));
  g.lineTo(...p(0.34, 0.4));
  g.lineTo(...p(0.43, 0.54));
  g.lineTo(...p(0.37, 0.58));
  g.lineTo(...p(0.4, 0.64));
  g.lineTo(...p(0.36, 0.69));
  g.lineTo(...p(0.38, 0.76));
  g.lineTo(...p(0.32, 0.86));
  g.lineTo(...p(0.2, 0.9));
  g.lineTo(...p(0.3, 1.06));
  g.bezierCurveTo(...p(0.5, 1.12), ...p(0.62, 1.2), ...p(0.66, 1.34));
  g.closePath();
}

const bust: Kind<Bust> = {
  id: "bust",
  weight: 2.6,
  radius: [70, 130],
  depth: [0.75, 1],
  zone: "side",
  reach: 1.5,
  make: (rnd) => ({
    ph: rnd() * TAU,
    flip: rnd() < 0.5 ? 1 : -1,
    veins: Array.from({ length: 6 }, () => [rnd() * 0.8 - 0.3, rnd() * 1.2, rnd() * 0.5 - 0.25, rnd() * 0.3 + 0.1]),
  }),
  draw(g, b, e, x, y, r, a) {
    const m = marble(e.light);
    const pink = e.accent;
    const cyan = e.accent2;
    const s = r * 0.95;
    const bob = Math.sin(e.t * 0.3 + b.ph) * r * 0.05;
    g.save();
    g.translate(x, y - s * 0.7 + bob);
    g.scale(b.flip, 1);
    g.rotate(Math.sin(e.t * 0.2 + b.ph) * 0.05);
    bustPath(g, s);
    // the stone: lit from the upper left, shadow toward the lower right
    const stone = g.createLinearGradient(-s * 0.5, -s * 0.1, s * 0.65, s * 1.3);
    stone.addColorStop(0, rgba(mix(m, pink, 0.12), a));
    stone.addColorStop(0.5, rgba(mix(m, [140, 126, 180], 0.45), a));
    stone.addColorStop(1, rgba(mix([40, 30, 80], cyan, 0.2), a));
    g.fillStyle = stone;
    g.fill();
    g.save();
    bustPath(g, s);
    g.clip();
    // veins in the marble
    g.strokeStyle = rgba([110, 100, 140], a * 0.22);
    g.lineWidth = 1;
    for (const [vx, vy, vw, vh] of b.veins) {
      g.beginPath();
      g.moveTo(vx * s, vy * s);
      g.bezierCurveTo((vx + vw) * s, (vy + vh * 0.3) * s, (vx - vw) * s, (vy + vh * 0.7) * s, (vx + vw * 0.5) * s, (vy + vh) * s);
      g.stroke();
    }
    // the brow, the eye socket and the hollow of the cheek: the shading that makes it a face
    const shade = (cx: number, cy: number, rx: number, ry: number, alpha: number) => {
      const grad = g.createRadialGradient(cx * s, cy * s, 0, cx * s, cy * s, Math.max(rx, ry) * s);
      grad.addColorStop(0, `rgba(30,20,60,${alpha * a})`);
      grad.addColorStop(1, "rgba(30,20,60,0)");
      g.fillStyle = grad;
      g.save();
      g.translate(cx * s, cy * s);
      g.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
      g.translate(-cx * s, -cy * s);
      g.fillRect((cx - rx) * s, (cy - ry) * s, rx * 2 * s, ry * 2 * s);
      g.restore();
    };
    shade(0.28, 0.4, 0.1, 0.07, 0.5);
    shade(0.2, 0.62, 0.14, 0.12, 0.28);
    shade(-0.1, 0.7, 0.2, 0.3, 0.3);
    g.restore();
    // a cool light along the shadow edge
    bustPath(g, s);
    g.strokeStyle = rgba(cyan, a * 0.55);
    g.lineWidth = 1.4;
    g.stroke();
    g.restore();
    // the plinth
    const px = x - s * 0.5;
    const baseY = y + s * 0.7;
    for (let i = 0; i < 2; i++) {
      const w = s * (1.1 + i * 0.25);
      const top = baseY + i * s * 0.12;
      const face = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      face.addColorStop(0, rgba(mix(m, pink, 0.2), a));
      face.addColorStop(1, rgba(mix([50, 38, 100], cyan, 0.2), a));
      g.fillStyle = face;
      g.fillRect(x - w / 2, top, w, s * 0.12);
      g.fillStyle = rgba([255, 255, 255], a * 0.3);
      g.fillRect(x - w / 2, top, w, 1);
    }
    void px;
  },
};

// ---------------------------------------------------------------------------------------------
// Retro computer: a beige monitor and base unit from the early 90s, its glass showing a slowly drifting
// wireframe landscape under a flat sun. The power light breathes on a long cycle. Nothing on the
// screen flickers or scans.
// ---------------------------------------------------------------------------------------------

interface Crt {
  ph: number;
  tilt: number;
}

const crt: Kind<Crt> = {
  id: "crt",
  weight: 2.2,
  radius: [60, 110],
  depth: [0.75, 1],
  reach: 1.3,
  make: (rnd) => ({ ph: rnd() * TAU, tilt: (rnd() - 0.5) * 0.12 }),
  draw(g, c, e, x, y, r, a) {
    const pink = e.accent;
    const cyan = e.accent2;
    const w = r * 1.5;
    const h = r * 1.25;
    g.save();
    g.translate(x, y + Math.sin(e.t * 0.3 + c.ph) * r * 0.04);
    g.rotate(c.tilt + Math.sin(e.t * 0.12 + c.ph) * 0.02);
    // the case
    const shell = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    shell.addColorStop(0, `rgba(232,224,206,${a})`);
    shell.addColorStop(1, `rgba(176,166,148,${a})`);
    g.fillStyle = shell;
    g.beginPath();
    g.roundRect(-w / 2, -h / 2, w, h, r * 0.1);
    g.fill();
    g.strokeStyle = `rgba(255,255,255,${a * 0.6})`;
    g.lineWidth = 1;
    g.stroke();
    // the screen: curved glass in a dark bezel
    const sw = w * 0.78;
    const sh = h * 0.66;
    g.fillStyle = `rgba(14,12,22,${a})`;
    g.beginPath();
    g.roundRect(-sw / 2 - 6, -h * 0.44, sw + 12, sh + 12, r * 0.12);
    g.fill();
    g.save();
    g.beginPath();
    g.roundRect(-sw / 2, -h * 0.44 + 6, sw, sh, r * 0.1);
    g.clip();
    const sky = g.createLinearGradient(0, -h * 0.44, 0, -h * 0.44 + sh);
    sky.addColorStop(0, rgba([24, 10, 60], a));
    sky.addColorStop(0.6, rgba(mix(pink, [60, 10, 90], 0.4), a));
    sky.addColorStop(1, rgba(cyan, a * 0.8));
    g.fillStyle = sky;
    g.fillRect(-sw / 2, -h * 0.44, sw, sh + 12);
    // a flat sun and a wireframe landscape that slides toward you
    const hy = -h * 0.44 + 6 + sh * 0.62;
    g.fillStyle = rgba([255, 238, 170], a * 0.95);
    g.beginPath();
    g.arc(0, hy - sw * 0.04, sw * 0.17, Math.PI, 0);
    g.fill();
    g.strokeStyle = rgba(cyan, a * 0.8);
    g.lineWidth = 1;
    const slide = (e.t * 0.2) % 1;
    for (let i = 0; i < 6; i++) {
      const z = (i + slide) / 6;
      const yy = hy + (sh * 0.4) * Math.pow(z, 1.8);
      g.beginPath();
      g.moveTo(-sw / 2, yy);
      g.lineTo(sw / 2, yy);
      g.stroke();
    }
    for (let i = -5; i <= 5; i++) {
      g.beginPath();
      g.moveTo(i * sw * 0.01, hy);
      g.lineTo(i * sw * 0.12, hy + sh * 0.42);
      g.stroke();
    }
    g.restore();
    // glass reflection
    const gloss = g.createLinearGradient(-sw / 2, -h * 0.44, sw * 0.1, -h * 0.44 + sh * 0.6);
    gloss.addColorStop(0, "rgba(255,255,255,0.2)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gloss;
    g.beginPath();
    g.roundRect(-sw / 2, -h * 0.44 + 6, sw, sh, r * 0.1);
    g.fill();
    // the lower panel: a disk slot, a power button and its light
    g.fillStyle = `rgba(40,36,34,${a * 0.9})`;
    g.fillRect(-w * 0.34, h * 0.36, w * 0.36, 3);
    g.fillStyle = `rgba(150,140,124,${a})`;
    g.beginPath();
    g.arc(w * 0.3, h * 0.38, r * 0.05, 0, TAU);
    g.fill();
    const breathe = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(e.t * 0.6 + c.ph));
    g.fillStyle = rgba(mix(cyan, [190, 255, 190], 0.5), a * breathe);
    g.beginPath();
    g.arc(w * 0.4, h * 0.38, 2.2, 0, TAU);
    g.fill();
    g.restore();
  },
};

// ---------------------------------------------------------------------------------------------
// Palm: a tall, leaning palm in silhouette, its fronds arching and trembling in a warm wind, with a
// rim of pink on the side that faces the sun.
// ---------------------------------------------------------------------------------------------

interface Palm {
  lean: number;
  fronds: { ang: number; len: number; ph: number }[];
  ph: number;
  flip: number;
}

const palm: Kind<Palm> = {
  id: "palm",
  weight: 2.4,
  radius: [90, 170],
  depth: [0.85, 1],
  zone: "edge",
  reach: 1.6,
  make: (rnd) => ({
    lean: (rnd() - 0.5) * 0.5,
    fronds: Array.from({ length: 9 }, (_, i) => ({ ang: -Math.PI + (i / 8) * Math.PI + (rnd() - 0.5) * 0.2 - 0.2, len: 0.8 + rnd() * 0.4, ph: rnd() * TAU })),
    ph: rnd() * TAU,
    flip: rnd() < 0.5 ? 1 : -1,
  }),
  draw(g, p, e, x, y, r, a) {
    const dark: Rgb = e.light ? [60, 30, 90] : [10, 4, 26];
    const rim = e.accent;
    const sway = Math.sin(e.t * 0.5 + p.ph) * 0.03;
    g.save();
    g.translate(x, y + r);
    g.scale(p.flip, 1);
    // the trunk: tapering, with a curve
    const topX = Math.sin(p.lean + sway) * r * 0.5;
    const topY = -r * 2;
    g.fillStyle = rgba(dark, a);
    g.beginPath();
    g.moveTo(-r * 0.045, 0);
    g.quadraticCurveTo(topX * 0.3 - r * 0.07, topY * 0.5, topX - r * 0.025, topY);
    g.lineTo(topX + r * 0.025, topY);
    g.quadraticCurveTo(topX * 0.3 + r * 0.07, topY * 0.5, r * 0.045, 0);
    g.closePath();
    g.fill();
    g.strokeStyle = rgba(rim, a * 0.5);
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(r * 0.045, 0);
    g.quadraticCurveTo(topX * 0.3 + r * 0.07, topY * 0.5, topX + r * 0.025, topY);
    g.stroke();
    // fronds
    for (const f of p.fronds) {
      const flutter = Math.sin(e.t * 1.1 + f.ph) * 0.06 + sway * 2;
      const ang = f.ang + flutter;
      const len = r * 0.95 * f.len;
      g.save();
      g.translate(topX, topY);
      g.rotate(ang + Math.PI / 2 - Math.PI / 2);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(len * 0.5, -len * 0.35, len, len * 0.28);
      g.quadraticCurveTo(len * 0.5, -len * 0.18, 0, 0);
      g.fillStyle = rgba(dark, a);
      g.fill();
      // leaflets
      g.strokeStyle = rgba(dark, a * 0.9);
      g.lineWidth = 1.1;
      for (let i = 1; i < 14; i++) {
        const t = i / 14;
        const bx = len * t;
        const by = -len * 0.35 * 2 * t * (1 - t) + len * 0.28 * t * t;
        g.beginPath();
        g.moveTo(bx, by);
        g.lineTo(bx + len * 0.05, by + len * 0.12 * (1 - t * 0.4));
        g.stroke();
        g.beginPath();
        g.moveTo(bx, by);
        g.lineTo(bx + len * 0.05, by - len * 0.1 * (1 - t * 0.4));
        g.stroke();
      }
      g.restore();
    }
    g.restore();
  },
};

// The bust and the computer are real scanned models now (models.ts); only the palm is drawn.
export const more: Kind[] = [palm] as Kind[];
void bust;
void crt;

import type { SceneEnv } from "../shared/scene/types";
import type { Kind } from "../shared/scene/world";

const TAU = Math.PI * 2;

/** The brightness (0-255) of a polished surface at `u` across it (0 to 1): a base that swings with the
 * viewing angle, a hard specular streak where the light is, and a dark core reflecting the floor. */
function tone(u: number, light: number, spec: number, bright: boolean): number {
  const base = 0.5 + 0.42 * Math.sin(TAU * (u * 1.5 + light));
  const streak = Math.exp(-(((u - spec) / 0.05) ** 2)) * 0.75;
  const edge = Math.pow(Math.abs(u - 0.5) * 2, 4) * 0.5;
  const v = Math.min(1, Math.max(0, base * (bright ? 0.9 : 0.55) + streak - edge));
  return Math.round(14 + v * 236);
}

function bandGradient(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, light: number, spec: number, a: number, bright: boolean): CanvasGradient {
  const grad = g.createLinearGradient(x0, y0, x1, y1);
  for (let i = 0; i <= 14; i++) {
    const u = i / 14;
    const t = tone(u, light, spec, bright);
    grad.addColorStop(u, `rgba(${t},${t + 3},${Math.min(255, t + 10)},${a})`);
  }
  return grad;
}

/** Where the light sits, from the cursor if it is there and from a slow drift if not. */
function lightPos(e: SceneEnv, x: number, y: number, ph: number): { phase: number; spec: number } {
  const dx = e.seen ? (e.mx - x) / e.w : Math.sin(e.t * 0.08 + ph) * 0.4;
  return { phase: dx * 0.7 + ph * 0.1 + e.t * 0.02, spec: Math.min(0.9, Math.max(0.1, 0.5 + dx * 0.9)) };
}

// ---------------------------------------------------------------------------------------------
// Gear: a machined, polished spur gear turning slowly. Its face is a ring of alternating reflections
// that stays fixed while the teeth go round, the hub is a dished centre with bolt heads.
// ---------------------------------------------------------------------------------------------

interface Gear {
  teeth: number;
  rot: number;
  spin: number;
  ph: number;
}

const gear: Kind<Gear> = {
  id: "gear",
  weight: 2.6,
  radius: [50, 110],
  depth: [0.8, 1],
  reach: 1.3,
  make: (rnd) => ({ teeth: 12 + Math.floor(rnd() * 8), rot: rnd() * TAU, spin: (0.08 + rnd() * 0.12) * (rnd() < 0.5 ? -1 : 1), ph: rnd() * TAU }),
  update(s, e) {
    s.rot += s.spin * e.dt;
  },
  draw(g, s, e, x, y, r, a) {
    const L = lightPos(e, x, y, s.ph);
    const body = g.createConicGradient(L.phase * TAU, x, y);
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const t = tone(u, 0, L.spec, !e.light);
      body.addColorStop(u, `rgba(${t},${t + 3},${t + 10},${a})`);
    }
    // outline with teeth: trapezoids around a core circle
    g.beginPath();
    for (let i = 0; i < s.teeth; i++) {
      const a0 = s.rot + (i / s.teeth) * TAU;
      const w = TAU / s.teeth;
      const r0 = r * 0.84;
      const r1 = r;
      const pts: [number, number][] = [
        [a0, r0],
        [a0 + w * 0.12, r1],
        [a0 + w * 0.48, r1],
        [a0 + w * 0.62, r0],
      ];
      pts.forEach(([ang, rad], k) => {
        const px = x + Math.cos(ang) * rad;
        const py = y + Math.sin(ang) * rad;
        if (i === 0 && k === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      });
    }
    g.closePath();
    g.fillStyle = body;
    g.fill();
    g.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
    g.lineWidth = 1;
    g.stroke();
    // the web: a recessed ring, then the hub
    g.strokeStyle = `rgba(0,0,0,${a * 0.5})`;
    g.lineWidth = r * 0.04;
    g.beginPath();
    g.arc(x, y, r * 0.66, 0, TAU);
    g.stroke();
    g.strokeStyle = `rgba(255,255,255,${a * 0.4})`;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(x, y, r * 0.69, 0, TAU);
    g.stroke();
    const hub = g.createRadialGradient(x - r * 0.1, y - r * 0.12, r * 0.04, x, y, r * 0.42);
    hub.addColorStop(0, `rgba(250,252,255,${a})`);
    hub.addColorStop(0.55, `rgba(110,118,132,${a})`);
    hub.addColorStop(1, `rgba(20,24,32,${a})`);
    g.fillStyle = hub;
    g.beginPath();
    g.arc(x, y, r * 0.42, 0, TAU);
    g.fill();
    // bolt heads around the hub
    for (let i = 0; i < 6; i++) {
      const ang = s.rot + (i / 6) * TAU;
      const bx = x + Math.cos(ang) * r * 0.27;
      const by = y + Math.sin(ang) * r * 0.27;
      const bolt = g.createRadialGradient(bx - r * 0.01, by - r * 0.01, 0, bx, by, r * 0.05);
      bolt.addColorStop(0, `rgba(255,255,255,${a})`);
      bolt.addColorStop(1, `rgba(60,66,78,${a})`);
      g.fillStyle = bolt;
      g.beginPath();
      g.arc(bx, by, r * 0.05, 0, TAU);
      g.fill();
    }
    g.fillStyle = `rgba(8,10,14,${a})`;
    g.beginPath();
    g.arc(x, y, r * 0.09, 0, TAU);
    g.fill();
  },
};

// ---------------------------------------------------------------------------------------------
// Polished pipe: a quarter or half bend of tube between two flanges. The tube is drawn as many thin
// concentric strokes, each a slice of the reflection across its width, so it reads as a round, mirror
// polished pipe; the bright streak moves along it as the light moves.
// ---------------------------------------------------------------------------------------------

interface Pipe {
  sweep: number;
  rot: number;
  ph: number;
  turn: number;
}

const pipe: Kind<Pipe> = {
  id: "pipe",
  weight: 2.2,
  radius: [60, 120],
  depth: [0.8, 1],
  reach: 1.4,
  make: (rnd) => ({ sweep: Math.PI * (0.5 + rnd() * 0.5), rot: rnd() * TAU, ph: rnd() * TAU, turn: (rnd() - 0.5) * 0.06 }),
  update(s, e) {
    s.rot += s.turn * e.dt;
  },
  draw(g, s, e, x, y, r, a) {
    const L = lightPos(e, x, y, s.ph);
    const R = r * 0.78;
    const thick = r * 0.3;
    const slices = 16;
    const a0 = s.rot;
    g.lineCap = "butt";
    for (let i = 0; i < slices; i++) {
      const u = i / (slices - 1);
      const t = tone(u, L.phase, L.spec, !e.light);
      g.strokeStyle = `rgba(${t},${t + 3},${Math.min(255, t + 10)},${a})`;
      g.lineWidth = thick / slices + 0.6;
      g.beginPath();
      g.arc(x, y, R + (u - 0.5) * thick, a0, a0 + s.sweep);
      g.stroke();
    }
    // the flanges at each end
    for (const ang of [a0, a0 + s.sweep]) {
      g.save();
      g.translate(x + Math.cos(ang) * R, y + Math.sin(ang) * R);
      g.rotate(ang);
      const flange = g.createLinearGradient(0, -thick * 0.9, 0, thick * 0.9);
      flange.addColorStop(0, `rgba(240,244,252,${a})`);
      flange.addColorStop(0.5, `rgba(70,76,90,${a})`);
      flange.addColorStop(1, `rgba(220,226,238,${a})`);
      g.fillStyle = flange;
      g.fillRect(-thick * 0.12, -thick * 0.9, thick * 0.24, thick * 1.8);
      g.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
      g.lineWidth = 0.8;
      g.strokeRect(-thick * 0.12, -thick * 0.9, thick * 0.24, thick * 1.8);
      g.restore();
    }
  },
};

// ---------------------------------------------------------------------------------------------
// Cylinder: a machined metal rod standing on end, with turned grooves and a polished cap. Its vertical
// reflections slide sideways as the light moves, which is how a real cylinder shows it is round.
// ---------------------------------------------------------------------------------------------

interface Rod {
  w: number;
  h: number;
  grooves: number[];
  ph: number;
  tilt: number;
}

const rod: Kind<Rod> = {
  id: "cylinder",
  weight: 2.2,
  radius: [60, 130],
  depth: [0.8, 1],
  zone: "side",
  reach: 1.4,
  make: (rnd, r) => ({ w: r * (0.22 + rnd() * 0.12), h: r * (1.5 + rnd() * 0.8), grooves: [0.22, 0.34, 0.7, 0.8].filter(() => rnd() < 0.8), ph: rnd() * TAU, tilt: (rnd() - 0.5) * 0.25 }),
  draw(g, s, e, x, y, r, a) {
    const L = lightPos(e, x, y, s.ph);
    g.save();
    g.translate(x, y);
    g.rotate(s.tilt + Math.sin(e.t * 0.1 + s.ph) * 0.02);
    const top = -s.h / 2;
    g.fillStyle = bandGradient(g, -s.w, 0, s.w, 0, L.phase, L.spec, a, !e.light);
    g.fillRect(-s.w, top, s.w * 2, s.h);
    // turned grooves
    for (const k of s.grooves) {
      g.fillStyle = `rgba(0,0,0,${a * 0.4})`;
      g.fillRect(-s.w, top + s.h * k, s.w * 2, 2.4);
      g.fillStyle = `rgba(255,255,255,${a * 0.45})`;
      g.fillRect(-s.w, top + s.h * k + 2.4, s.w * 2, 1);
    }
    // the polished top face, seen slightly from above
    const cap = g.createRadialGradient(-s.w * 0.3, top - s.w * 0.1, 0, 0, top, s.w * 1.1);
    cap.addColorStop(0, `rgba(255,255,255,${a})`);
    cap.addColorStop(1, `rgba(120,128,142,${a})`);
    g.fillStyle = cap;
    g.beginPath();
    g.ellipse(0, top, s.w, s.w * 0.3, 0, 0, TAU);
    g.fill();
    g.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
    g.lineWidth = 1;
    g.stroke();
    // a soft shadow where it stands
    g.fillStyle = `rgba(0,0,0,${a * (e.light ? 0.15 : 0.35)})`;
    g.beginPath();
    g.ellipse(0, s.h / 2, s.w * 1.2, s.w * 0.26, 0, 0, TAU);
    g.fill();
    g.restore();
  },
};

// ---------------------------------------------------------------------------------------------
// Mirror panel: a flat sheet of polished metal, tipped away from the viewer, reflecting a bright sky and
// a dark floor with a hard horizon between them. A band of light crosses it, following the cursor.
// ---------------------------------------------------------------------------------------------

interface Panel {
  w: number;
  h: number;
  skew: number;
  ph: number;
}

const panel: Kind<Panel> = {
  id: "panel",
  weight: 1.8,
  radius: [70, 140],
  depth: [0.7, 1],
  reach: 1.3,
  make: (rnd, r) => ({ w: r * (0.9 + rnd() * 0.5), h: r * (0.7 + rnd() * 0.4), skew: (rnd() - 0.5) * 0.3, ph: rnd() * TAU }),
  draw(g, s, e, x, y, r, a) {
    const L = lightPos(e, x, y, s.ph);
    const sway = Math.sin(e.t * 0.2 + s.ph) * 0.04;
    g.save();
    g.translate(x, y);
    g.transform(1, s.skew * 0.5, s.skew, 1, 0, 0);
    g.rotate(sway);
    const hw = s.w / 2;
    const hh = s.h / 2;
    // sky and floor with the horizon between them
    const hor = (L.spec - 0.5) * s.h * 0.5;
    const face = g.createLinearGradient(0, -hh, 0, hh);
    const hu = Math.min(0.85, Math.max(0.15, 0.5 + hor / s.h));
    face.addColorStop(0, `rgba(220,228,244,${a})`);
    face.addColorStop(hu - 0.01, `rgba(96,104,122,${a})`);
    face.addColorStop(hu, `rgba(255,255,255,${a})`);
    face.addColorStop(hu + 0.01, `rgba(24,28,36,${a})`);
    face.addColorStop(1, `rgba(8,10,14,${a})`);
    g.fillStyle = face;
    g.beginPath();
    g.roundRect(-hw, -hh, s.w, s.h, 3);
    g.fill();
    // the moving band of light
    const k = (L.phase * 2.2 + 0.5) % 1;
    const sx = -hw + (k < 0 ? k + 1 : k) * s.w * 1.4 - s.w * 0.2;
    g.save();
    g.beginPath();
    g.roundRect(-hw, -hh, s.w, s.h, 3);
    g.clip();
    const beam = g.createLinearGradient(sx - s.w * 0.12, 0, sx + s.w * 0.12, 0);
    beam.addColorStop(0, "rgba(255,255,255,0)");
    beam.addColorStop(0.5, `rgba(255,255,255,${a * 0.6})`);
    beam.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = beam;
    g.fillRect(-hw, -hh, s.w, s.h);
    g.restore();
    // the bevelled edge and four fixing screws
    g.strokeStyle = `rgba(255,255,255,${a * 0.7})`;
    g.lineWidth = 1.2;
    g.beginPath();
    g.roundRect(-hw, -hh, s.w, s.h, 3);
    g.stroke();
    for (const [sx2, sy2] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const bx = sx2 * (hw - 9);
      const by = sy2 * (hh - 9);
      const screw = g.createRadialGradient(bx - 1, by - 1, 0, bx, by, 4);
      screw.addColorStop(0, `rgba(255,255,255,${a})`);
      screw.addColorStop(1, `rgba(60,66,78,${a})`);
      g.fillStyle = screw;
      g.beginPath();
      g.arc(bx, by, 3.4, 0, TAU);
      g.fill();
    }
    g.restore();
  },
};

// ---------------------------------------------------------------------------------------------
// Hex bolt: a bolt head seen from above, three bevelled faces catching light differently, and a washer
// under it. It turns very slowly, and the reflections stay where the light is.
// ---------------------------------------------------------------------------------------------

interface Bolt {
  rot: number;
  spin: number;
  ph: number;
}

const bolt: Kind<Bolt> = {
  id: "bolt",
  weight: 1.4,
  radius: [34, 70],
  depth: [0.85, 1],
  reach: 1.3,
  make: (rnd) => ({ rot: rnd() * TAU, spin: (0.05 + rnd() * 0.08) * (rnd() < 0.5 ? -1 : 1), ph: rnd() * TAU }),
  update(s, e) {
    s.rot += s.spin * e.dt;
  },
  draw(g, s, e, x, y, r, a) {
    const L = lightPos(e, x, y, s.ph);
    const washer = g.createConicGradient(L.phase * TAU, x, y);
    for (let i = 0; i <= 8; i++) {
      const t = tone(i / 8, 0, L.spec, !e.light);
      washer.addColorStop(i / 8, `rgba(${t},${t + 3},${t + 10},${a})`);
    }
    g.fillStyle = washer;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
    g.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
    g.lineWidth = 1;
    g.stroke();
    // the hexagonal head
    const hexR = r * 0.78;
    for (let i = 0; i < 6; i++) {
      const a0 = s.rot + (i / 6) * TAU;
      const a1 = s.rot + ((i + 1) / 6) * TAU;
      const mid = (a0 + a1) / 2;
      const lit = 0.5 + 0.5 * Math.cos(mid - L.phase * TAU * 0.5 - 0.8);
      const t = Math.round(30 + lit * 215);
      g.fillStyle = `rgba(${t},${t + 3},${Math.min(255, t + 10)},${a})`;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a0) * hexR, y + Math.sin(a0) * hexR);
      g.lineTo(x + Math.cos(a1) * hexR, y + Math.sin(a1) * hexR);
      g.closePath();
      g.fill();
      g.strokeStyle = `rgba(255,255,255,${a * 0.35})`;
      g.lineWidth = 0.8;
      g.stroke();
    }
    const cap = g.createRadialGradient(x - r * 0.12, y - r * 0.12, 0, x, y, r * 0.5);
    cap.addColorStop(0, `rgba(255,255,255,${a})`);
    cap.addColorStop(0.7, `rgba(120,128,142,${a})`);
    cap.addColorStop(1, `rgba(30,34,42,${a})`);
    g.fillStyle = cap;
    g.beginPath();
    g.arc(x, y, r * 0.5, 0, TAU);
    g.fill();
    g.fillStyle = `rgba(6,8,12,${a * 0.9})`;
    g.beginPath();
    g.arc(x, y, r * 0.12, 0, TAU);
    g.fill();
  },
};

// ---------------------------------------------------------------------------------------------
// Spindle: a stack of turned discs of different diameters on a shaft, like a piece of precision
// machinery. Each disc reflects the light a little differently, and the stack slowly changes which side
// is bright.
// ---------------------------------------------------------------------------------------------

interface Spindle {
  discs: { rad: number; h: number }[];
  ph: number;
}

const spindle: Kind<Spindle> = {
  id: "spindle",
  weight: 1.4,
  radius: [60, 120],
  depth: [0.8, 1],
  zone: "edge",
  reach: 1.4,
  make(rnd, r) {
    return { discs: Array.from({ length: 6 + Math.floor(rnd() * 3) }, () => ({ rad: r * (0.22 + rnd() * 0.3), h: r * (0.08 + rnd() * 0.12) })), ph: rnd() * TAU };
  },
  draw(g, s, e, x, y, r, a) {
    const L = lightPos(e, x, y, s.ph);
    const total = s.discs.reduce((acc, d) => acc + d.h, 0);
    // the shaft through the middle
    g.fillStyle = bandGradient(g, x - r * 0.07, 0, x + r * 0.07, 0, L.phase, L.spec, a, !e.light);
    g.fillRect(x - r * 0.07, y - total / 2 - r * 0.2, r * 0.14, total + r * 0.4);
    let cy = y - total / 2;
    s.discs.forEach((d, i) => {
      const flat = d.rad * 0.26;
      g.fillStyle = bandGradient(g, x - d.rad, 0, x + d.rad, 0, L.phase + i * 0.08, L.spec, a, !e.light);
      g.fillRect(x - d.rad, cy, d.rad * 2, d.h);
      g.fillStyle = bandGradient(g, x - d.rad, 0, x + d.rad, 0, L.phase + i * 0.08, L.spec, a, !e.light);
      g.beginPath();
      g.ellipse(x, cy + d.h, d.rad, flat, 0, 0, Math.PI);
      g.fill();
      const top = g.createRadialGradient(x - d.rad * 0.3, cy - flat * 0.2, 0, x, cy, d.rad);
      top.addColorStop(0, `rgba(255,255,255,${a})`);
      top.addColorStop(1, `rgba(130,138,152,${a})`);
      g.fillStyle = top;
      g.beginPath();
      g.ellipse(x, cy, d.rad, flat, 0, 0, TAU);
      g.fill();
      g.strokeStyle = `rgba(255,255,255,${a * 0.45})`;
      g.lineWidth = 0.8;
      g.stroke();
      cy += d.h;
    });
  },
};

export const machined: Kind[] = [gear, pipe, rod, panel, bolt, spindle] as Kind[];

import type { Rgb, SceneEnv, SceneFactory } from "../shared/scene/types";
import { makeLayer, mix, noise2, rgba } from "../shared/scene/util";
import { createWorld } from "../shared/scene/world";
import { kinds } from "./objects";
import { createStage } from "../shared/scene/stage";
import { createCar } from "./car";
import { createTraffic } from "./road";
import { createSkyline } from "./skyline";

interface Trail {
  x: number;
  y: number;
  t: number;
}

interface Streak {
  y: number;
  x: number;
  speed: number;
  len: number;
  tone: number;
}

const HOT: Rgb = [255, 42, 157];
const CYAN: Rgb = [34, 229, 255];
const ORANGE: Rgb = [255, 158, 61];
const YELLOW: Rgb = [253, 224, 71];

/** Neon night: a low sunset sliced by scan lines, wireframe mountains, and a glowing grid that rushes
 * toward you faster the more you scroll. The grid bends toward the cursor and lights up around it;
 * the cursor leaves a neon trail and now and then a light streak crosses the floor. */
export const createScene: SceneFactory = (canvas, env, objects, models) => {
  const g = canvas.getContext("2d");
  if (!g) return { frame() {} };
  const rnd = Math.random;
  const fx = objects.getContext("2d");
  const world = createWorld(kinds, { perScreen: 2.8, veil: 0.34 });
  const traffic = createTraffic();
  const stage = createStage(models, env, { key: 0xff7ac8, fill: 0x3ee6ff, sky: 0x9a6cff, ground: 0x1a0a3a, exposure: 1.15, envIntensity: 0.8 });
  const car = createCar(() => stage);
  const city = createSkyline(Math.random, [34, 229, 255]);
  const trail: Trail[] = [];
  const streaks: Streak[] = [];
  let nextStreak = 2;
  let travel = 0;
  const stars = Array.from({ length: 90 }, () => ({ x: rnd(), y: rnd() * 0.5, r: 0.4 + rnd() * 1.2, ph: rnd() * 6.28 }));

  function ridge(e: SceneEnv, seed: number, base: number, amp: number, step: number) {
    const pts: [number, number][] = [];
    for (let x = -step; x <= e.w + step; x += step) {
      const n = noise2(x * 0.004 + seed, seed * 3.1) * 0.7 + noise2(x * 0.012 + seed * 7, 1.7) * 0.3;
      // a valley in the middle so the sun shows between the peaks
      const centre = Math.abs(x - e.w / 2) / (e.w / 2);
      pts.push([x, base - amp * n * (0.25 + 0.75 * Math.min(1, centre * 1.3))]);
    }
    return pts;
  }
  let ridges: { back: [number, number][]; front: [number, number][] } | null = null;
  const layout = (e: SceneEnv) => {
    const horizon = e.h * 0.58;
    ridges = { back: ridge(e, 3.3, horizon, e.h * 0.34, 14), front: ridge(e, 9.1, horizon + 4, e.h * 0.2, 12) };
  };
  layout(env);

  const [sunLayer, sunG] = makeLayer(640, 640);

  function drawSun(e: SceneEnv, horizon: number) {
    const r = Math.min(e.w * 0.2, e.h * 0.3);
    const cx = e.w / 2 - (e.mx - e.w / 2) * 0.012;
    const cy = horizon - r * 0.12;
    // the glow around it
    const glow = g!.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.6);
    glow.addColorStop(0, rgba(HOT, e.light ? 0.3 : 0.5));
    glow.addColorStop(1, rgba(HOT, 0));
    g!.fillStyle = glow;
    g!.fillRect(0, 0, e.w, horizon + 20);
    // the sun is drawn on its own layer so the scan-line slits can be cut out of it
    const s = sunLayer.width;
    sunG.clearRect(0, 0, s, s);
    const grad = sunG.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0, rgba(YELLOW, 1));
    grad.addColorStop(0.45, rgba(ORANGE, 1));
    grad.addColorStop(1, rgba(HOT, 1));
    sunG.fillStyle = grad;
    sunG.beginPath();
    sunG.arc(s / 2, s / 2, s / 2 - 2, 0, 6.2832);
    sunG.fill();
    sunG.globalCompositeOperation = "destination-out";
    const drift = (e.t * 14) % 52;
    for (let i = -1; i < 12; i++) {
      const y = s * 0.4 + i * 52 + drift;
      const th = 2 + Math.max(0, (y - s * 0.4) / s) * 30;
      if (y > s * 0.38) sunG.fillRect(0, y, s, th);
    }
    sunG.globalCompositeOperation = "source-over";
    g!.save();
    g!.beginPath();
    g!.rect(0, 0, e.w, horizon);
    g!.clip();
    g!.drawImage(sunLayer, cx - r, cy - r, r * 2, r * 2);
    g!.restore();
  }

  function drawFloor(e: SceneEnv, horizon: number) {
    const h = e.h - horizon;
    const light = e.light;
    const floor = g!.createLinearGradient(0, horizon, 0, e.h);
    floor.addColorStop(0, rgba(light ? [70, 20, 120] : [18, 4, 48], 0.95));
    floor.addColorStop(1, rgba(light ? [40, 10, 80] : [6, 1, 22], 0.98));
    g!.fillStyle = floor;
    g!.fillRect(0, horizon, e.w, h);

    const vx = e.w / 2;
    const px = e.seen ? e.mx : vx;
    const py = e.seen ? e.my : -1e4;
    const bend = (x: number, y: number) => {
      // the grid leans toward the cursor, more where the cursor is close
      const d = Math.hypot(x - px, y - py);
      return d < 260 ? ((px - x) * (1 - d / 260) ** 2) * 0.25 : 0;
    };
    const near = (x: number, y: number) => (e.seen ? Math.max(0, 1 - Math.hypot(x - px, y - py) / 300) : 0);

    g!.globalCompositeOperation = "lighter";
    g!.lineCap = "round";
    // lines across, flowing toward the viewer
    const speed = 0.22 + Math.min(1, Math.abs(e.vy) / 3000);
    travel += speed * e.dt * (e.still ? 0 : 1);
    const phase = (travel + e.scrollY * 0.0012) % 1;
    const rows = 18;
    for (let i = 0; i < rows; i++) {
      const z = (i + phase) / rows;
      const y = horizon + h * Math.pow(z, 2.4);
      const a = 0.1 + z * 0.9;
      const steps = 24;
      g!.beginPath();
      for (let k = 0; k <= steps; k++) {
        const x = (k / steps) * e.w;
        const yy = y + (e.seen ? -near(x, y) * 8 : 0);
        if (k === 0) g!.moveTo(x + bend(x, y), yy);
        else g!.lineTo(x + bend(x, y), yy);
      }
      g!.strokeStyle = rgba(HOT, a * 0.28);
      g!.lineWidth = 5;
      g!.stroke();
      g!.strokeStyle = rgba(mix(HOT, [255, 190, 235], 0.4), a * (light ? 0.9 : 0.85));
      g!.lineWidth = 1.2;
      g!.stroke();
    }
    // lines running away to the horizon
    for (let i = -22; i <= 22; i++) {
      const bottomX = vx + i * (e.w / 8);
      const topX = vx + i * 8;
      g!.beginPath();
      const steps = 14;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const x = topX + (bottomX - topX) * t * t * 0.5 + (bottomX - topX) * t * 0.5;
        const y = horizon + h * t;
        if (k === 0) g!.moveTo(x, y);
        else g!.lineTo(x + bend(x, y), y);
      }
      g!.strokeStyle = rgba(CYAN, 0.16);
      g!.lineWidth = 4.5;
      g!.stroke();
      g!.strokeStyle = rgba(mix(CYAN, [210, 255, 255], 0.35), light ? 0.8 : 0.7);
      g!.lineWidth = 1.1;
      g!.stroke();
    }
    g!.globalCompositeOperation = "source-over";

    // the glow where the grid meets the sky
    const hg = g!.createLinearGradient(0, horizon - 4, 0, horizon + 60);
    hg.addColorStop(0, rgba(HOT, 0.85));
    hg.addColorStop(1, rgba(HOT, 0));
    g!.fillStyle = hg;
    g!.fillRect(0, horizon - 2, e.w, 62);
  }

  function frame(e: SceneEnv) {
    g!.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
    g!.clearRect(0, 0, e.w, e.h);
    const horizon = e.h * 0.58;
    const light = e.light;

    const sky = g!.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, rgba(light ? [60, 20, 110] : [8, 2, 28], 0.9));
    sky.addColorStop(0.6, rgba(light ? [140, 30, 130] : [60, 8, 90], 0.85));
    sky.addColorStop(1, rgba(light ? [255, 90, 150] : [200, 20, 130], 0.7));
    g!.fillStyle = sky;
    g!.fillRect(0, 0, e.w, horizon + 1);

    for (const s of stars) {
      const tw = 0.4 + 0.6 * Math.sin(e.t * 1.7 + s.ph);
      g!.fillStyle = rgba([255, 235, 255], 0.75 * tw);
      g!.beginPath();
      g!.arc(s.x * e.w, s.y * horizon * 1.2, s.r, 0, 6.2832);
      g!.fill();
    }

    drawSun(e, horizon);

    // mountains: dark bodies with a neon edge
    if (ridges) {
      const draw = (pts: [number, number][], fill: Rgb, edge: Rgb, a: number) => {
        g!.beginPath();
        g!.moveTo(pts[0][0], horizon + 2);
        for (const [x, y] of pts) g!.lineTo(x, y);
        g!.lineTo(pts[pts.length - 1][0], horizon + 2);
        g!.closePath();
        g!.fillStyle = rgba(fill, 0.96);
        g!.fill();
        g!.beginPath();
        pts.forEach(([x, y], i) => (i ? g!.lineTo(x, y) : g!.moveTo(x, y)));
        g!.strokeStyle = rgba(edge, a);
        g!.lineWidth = 1.5;
        g!.stroke();
      };
      draw(ridges.back, [26, 6, 52], CYAN, 0.8);
      draw(ridges.front, [14, 3, 34], HOT, 0.95);
    }

    city.draw(g!, e, horizon);
    drawFloor(e, horizon);
    traffic.frame(g!, e, horizon);
    const spot = traffic.at(e, horizon, 0.8);
    car.frame(e, spot.cx + spot.half * 0.46, spot.y, spot.half * 0.62);
    if (fx) world.frame(fx, e);
    world.veil(g!, e, 0.5);
    stage?.render(e);

    if (!e.still) {
      // light streaks crossing the floor
      if (e.t > nextStreak) {
        nextStreak = e.t + 2.5 + Math.random() * 4;
        const z = 0.15 + Math.random() * 0.8;
        streaks.push({ y: horizon + (e.h - horizon) * Math.pow(z, 2.4), x: Math.random() < 0.5 ? -200 : e.w + 200, speed: (Math.random() < 0.5 ? 1 : -1) * (700 + z * 1400), len: 80 + z * 220, tone: Math.random() });
        const last = streaks[streaks.length - 1];
        last.x = last.speed > 0 ? -last.len : e.w + last.len;
      }
      g!.globalCompositeOperation = "lighter";
      for (let i = streaks.length - 1; i >= 0; i--) {
        const s = streaks[i];
        s.x += s.speed * e.dt;
        const dir = Math.sign(s.speed);
        const grad = g!.createLinearGradient(s.x, 0, s.x - dir * s.len, 0);
        const c = s.tone < 0.5 ? HOT : CYAN;
        grad.addColorStop(0, rgba([255, 255, 255], 0.95));
        grad.addColorStop(0.15, rgba(c, 0.7));
        grad.addColorStop(1, rgba(c, 0));
        g!.strokeStyle = grad;
        g!.lineWidth = 2.4;
        g!.beginPath();
        g!.moveTo(s.x, s.y);
        g!.lineTo(s.x - dir * s.len, s.y);
        g!.stroke();
        if (s.x < -s.len - 50 || s.x > e.w + s.len + 50) streaks.splice(i, 1);
      }

      // the cursor's neon trail
      if (e.seen) {
        const last = trail[trail.length - 1];
        if (!last || Math.hypot(last.x - e.mx, last.y - e.my) > 2) trail.push({ x: e.mx, y: e.my, t: e.t });
      }
      while (trail.length && e.t - trail[0].t > 0.7) trail.shift();
      if (trail.length > 1) {
        for (let i = 1; i < trail.length; i++) {
          const a = 1 - (e.t - trail[i].t) / 0.7;
          const c = mix(CYAN, HOT, i / trail.length);
          g!.strokeStyle = rgba(c, a * 0.35);
          g!.lineWidth = 9 * a;
          g!.lineCap = "round";
          g!.beginPath();
          g!.moveTo(trail[i - 1].x, trail[i - 1].y);
          g!.lineTo(trail[i].x, trail[i].y);
          g!.stroke();
          g!.strokeStyle = rgba(mix(c, [255, 255, 255], 0.6), a * 0.95);
          g!.lineWidth = 2 * a + 0.4;
          g!.stroke();
        }
      }
      g!.globalCompositeOperation = "source-over";
    }

    // a vignette keeps the page's text easy to read over the brightest parts
    const vig = g!.createRadialGradient(e.w / 2, e.h * 0.45, e.h * 0.2, e.w / 2, e.h * 0.45, Math.max(e.w, e.h) * 0.8);
    vig.addColorStop(0, rgba(e.bg, 0));
    vig.addColorStop(1, rgba(e.bg, e.light ? 0.45 : 0.55));
    g!.fillStyle = vig;
    g!.fillRect(0, 0, e.w, e.h);
  }

  return {
    frame,
    resize: (e) => {
      layout(e);
      stage?.resize(e);
      world.relayout(e);
    },
    destroy: () => {
      world.destroy();
      stage?.destroy();
    },
    press(x, y, e) {
      for (let i = 0; i < 5; i++) trail.push({ x: x + (Math.random() - 0.5) * 60, y: y + (Math.random() - 0.5) * 60, t: e.t });
    },
  };
};

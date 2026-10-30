import type { Rgb, SceneEnv } from "../shared/scene/types";
import { mix, noise2, rgba } from "../shared/scene/util";

const HOT: Rgb = [255, 42, 157];
const CYAN: Rgb = [34, 229, 255];

/** A skyline on the horizon: towers of different heights in dark silhouette with lit windows and a
 * few neon edges, drawn between the mountains and the road. */
export function drawSkyline(g: CanvasRenderingContext2D, e: SceneEnv, horizon: number) {
  const base = horizon + 2;
  let x = e.w * 0.18;
  const end = e.w * 0.82;
  let i = 0;
  while (x < end) {
    const w = 10 + noise2(i * 1.7, 3) * 26;
    const centre = 1 - Math.abs((x - e.w / 2) / (e.w * 0.32));
    const h = (18 + noise2(i * 0.9, 8) * 110) * (0.35 + Math.max(0, centre) * 0.9);
    g.fillStyle = rgba(e.light ? [64, 30, 100] : [14, 6, 34], 0.96);
    g.fillRect(x, base - h, w, h);
    // windows
    for (let wy = base - h + 4; wy < base - 3; wy += 6) {
      for (let wx = x + 2; wx < x + w - 2; wx += 5) {
        const lit = noise2(wx * 0.5 + i, wy * 0.5);
        if (lit < 0.62) continue;
        g.fillStyle = rgba(lit > 0.86 ? mix(CYAN, [255, 255, 255], 0.3) : mix(HOT, [255, 214, 190], 0.4), 0.78);
        g.fillRect(wx, wy, 2, 3);
      }
    }
    if (i % 5 === 0) {
      g.fillStyle = rgba(CYAN, 0.8);
      g.fillRect(x, base - h, w, 1.2);
    }
    if (i % 7 === 3) {
      g.strokeStyle = rgba([60, 40, 90], 0.9);
      g.beginPath();
      g.moveTo(x + w / 2, base - h);
      g.lineTo(x + w / 2, base - h - 14);
      g.stroke();
      const beat = 0.5 + 0.5 * Math.sin(e.t * 1.3 + i);
      g.fillStyle = rgba(HOT, 0.4 + beat * 0.6);
      g.beginPath();
      g.arc(x + w / 2, base - h - 14, 1.6, 0, Math.PI * 2);
      g.fill();
    }
    x += w + 1 + noise2(i, 5) * 3;
    i++;
  }
}

/** The drawn cars are retired: the car on the road is a real model (car.ts). */
const SPAWN_CARS = false;

interface Car {
  lane: number;
  z: number;
  speed: number;
  toward: boolean;
  tone: number;
}

/** The road: a lit highway running into the horizon with dashed centre lines moving toward you, and cars
 * on it. Receding cars show their tail lights, oncoming ones their headlights; each is lit by the
 * neon beneath it and grows as it nears. */
export function createTraffic() {
  const cars: Car[] = [];
  let next = 1.2;

  function roadAt(e: SceneEnv, horizon: number, z: number) {
    // z is 0 at the horizon and 1 at the bottom of the screen
    const y = horizon + (e.h - horizon) * Math.pow(z, 1.5);
    const half = 3 + z * e.w * 0.3;
    const cx = e.w / 2 - (e.mx - e.w / 2) * 0.03 * z;
    return { y, half, cx };
  }

  function drawCar(g: CanvasRenderingContext2D, e: SceneEnv, horizon: number, car: Car) {
    const { y, half, cx } = roadAt(e, horizon, car.z);
    const w = half * 0.46;
    const px = cx + car.lane * half * 0.5;
    const h = w * 0.42;
    const color: Rgb = car.tone < 0.5 ? HOT : CYAN;
    g.save();
    g.translate(px, y);
    // the glow of the neon strip under the car, thrown on the road
    g.save();
    g.globalCompositeOperation = "lighter";
    const under = g.createRadialGradient(0, 0, 0, 0, 0, w * 0.9);
    under.addColorStop(0, rgba(color, 0.5));
    under.addColorStop(1, rgba(color, 0));
    g.fillStyle = under;
    g.fillRect(-w, -w * 0.3, w * 2, w * 0.6);
    g.restore();
    // body: a low wedge seen from behind (or from the front)
    const body = g.createLinearGradient(0, -h, 0, 0);
    body.addColorStop(0, rgba([32, 14, 58], 1));
    body.addColorStop(1, rgba([8, 3, 20], 1));
    g.fillStyle = body;
    g.beginPath();
    g.moveTo(-w / 2, 0);
    g.lineTo(-w * 0.47, -h * 0.5);
    g.lineTo(-w * 0.3, -h);
    g.lineTo(w * 0.3, -h);
    g.lineTo(w * 0.47, -h * 0.5);
    g.lineTo(w / 2, 0);
    g.closePath();
    g.fill();
    // the glass
    g.fillStyle = rgba(mix(color, [10, 4, 24], 0.8), 0.9);
    g.beginPath();
    g.moveTo(-w * 0.26, -h * 0.55);
    g.lineTo(-w * 0.2, -h * 0.95);
    g.lineTo(w * 0.2, -h * 0.95);
    g.lineTo(w * 0.26, -h * 0.55);
    g.closePath();
    g.fill();
    // edge light along the roof and shoulders
    g.strokeStyle = rgba(color, 0.7);
    g.lineWidth = Math.max(0.6, w * 0.012);
    g.beginPath();
    g.moveTo(-w * 0.47, -h * 0.5);
    g.lineTo(-w * 0.3, -h);
    g.lineTo(w * 0.3, -h);
    g.lineTo(w * 0.47, -h * 0.5);
    g.stroke();
    // lights
    g.save();
    g.globalCompositeOperation = "lighter";
    const lamp: Rgb = car.toward ? [230, 250, 255] : [255, 40, 60];
    for (const side of [-1, 1]) {
      const lx = side * w * 0.36;
      const ly = -h * 0.28;
      const halo = g.createRadialGradient(lx, ly, 0, lx, ly, w * 0.22);
      halo.addColorStop(0, rgba(lamp, 1));
      halo.addColorStop(0.3, rgba(lamp, 0.45));
      halo.addColorStop(1, rgba(lamp, 0));
      g.fillStyle = halo;
      g.fillRect(lx - w * 0.22, ly - w * 0.22, w * 0.44, w * 0.44);
    }
    if (!car.toward) {
      // a bar of light joins the tail lights
      g.fillStyle = rgba(lamp, 0.85);
      g.fillRect(-w * 0.34, -h * 0.3, w * 0.68, Math.max(1, h * 0.06));
    }
    g.restore();
    g.restore();
  }

  return {
    at: roadAt,
    frame(g: CanvasRenderingContext2D, e: SceneEnv, horizon: number) {
      const c1 = roadAt(e, horizon, 0);
      const c2 = roadAt(e, horizon, 1);
      // the road surface
      g.beginPath();
      g.moveTo(c1.cx - c1.half, c1.y);
      g.lineTo(c1.cx + c1.half, c1.y);
      g.lineTo(c2.cx + c2.half, c2.y);
      g.lineTo(c2.cx - c2.half, c2.y);
      g.closePath();
      const asphalt = g.createLinearGradient(0, horizon, 0, e.h);
      asphalt.addColorStop(0, rgba([30, 12, 52], 0.98));
      asphalt.addColorStop(1, rgba([10, 4, 24], 0.98));
      g.fillStyle = asphalt;
      g.fill();
      // the kerbs: neon edges
      g.save();
      g.globalCompositeOperation = "lighter";
      for (const [side, color] of [[-1, HOT], [1, CYAN]] as [number, Rgb][]) {
        g.strokeStyle = rgba(color, 0.25);
        g.lineWidth = 7;
        g.beginPath();
        g.moveTo(c1.cx + side * c1.half, c1.y);
        g.lineTo(c2.cx + side * c2.half, c2.y);
        g.stroke();
        g.strokeStyle = rgba(mix(color, [255, 255, 255], 0.5), 0.95);
        g.lineWidth = 1.5;
        g.stroke();
      }
      g.restore();
      // centre dashes rushing toward the viewer
      const phase = (e.t * 0.55) % 1;
      g.fillStyle = rgba([255, 240, 250], 0.7);
      for (let i = 0; i < 14; i++) {
        const z0 = (i + phase) / 14;
        const z1 = z0 + 0.03;
        if (z1 > 1) continue;
        const a = roadAt(e, horizon, z0);
        const b = roadAt(e, horizon, z1);
        const wa = Math.max(0.5, a.half * 0.012);
        const wb = Math.max(0.5, b.half * 0.012);
        g.beginPath();
        g.moveTo(a.cx - wa, a.y);
        g.lineTo(a.cx + wa, a.y);
        g.lineTo(b.cx + wb, b.y);
        g.lineTo(b.cx - wb, b.y);
        g.closePath();
        g.fill();
      }
      // traffic
      if (!e.still) {
        if (SPAWN_CARS && e.t > next) {
          next = e.t + 2.2 + Math.random() * 4.5;
          const toward = Math.random() < 0.45;
          cars.push({ lane: toward ? 1 : -1, z: toward ? 0.02 : 0.94, speed: 0.08 + Math.random() * 0.1, toward, tone: Math.random() });
        }
        for (let i = cars.length - 1; i >= 0; i--) {
          const c = cars[i];
          // oncoming cars come at you; the others pull away
          c.z += (c.toward ? 1 : -1) * c.speed * e.dt * (0.4 + c.z * 1.6);
          if (c.z > 1.15 || c.z < 0.01) cars.splice(i, 1);
        }
      }
      cars.sort((a, b) => a.z - b.z);
      for (const c of cars) drawCar(g, e, horizon, c);
    },
  };
}

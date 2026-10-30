import type { Rgb, SceneEnv, SceneFactory } from "../shared/scene/types";
import { makeLayer, rgba } from "../shared/scene/util";
import { createWorld } from "../shared/scene/world";
import { kinds } from "./objects";

interface Mark {
  x: number;
  y: number;
}

/** Black and white, nothing else: film grain, a few big hairline circles and slow geometry, a
 * single scanning line, and a cursor that is drawn as precisely as a drafting tool (crosshair
 * lines through it, a ring that opens with speed, a thin tapering trail). */
export const createScene: SceneFactory = (canvas, _env, objects) => {
  const g = canvas.getContext("2d");
  if (!g) return { frame() {} };
  const rnd = Math.random;
  const fx = objects.getContext("2d");
  const world = createWorld(kinds, { perScreen: 2.8, veil: 0.3 });
  const trail: Mark[] = [];
  // a tile of film grain, redrawn at a random offset every frame
  const [grain, gg] = makeLayer(220, 220);
  const img = gg.createImageData(220, 220);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rnd() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  gg.putImageData(img, 0, 0);
  let ringOpen = 14;
  let pulse = 0;

  function frame(e: SceneEnv) {
    g!.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
    g!.clearRect(0, 0, e.w, e.h);
    const ink: Rgb = e.text;
    const light = e.light;
    const cx = e.w * 0.5 - (e.mx - e.w / 2) * 0.02;
    const cy = e.h * 0.5 - (e.my - e.h / 2) * 0.02 - e.scrollY * 0.04;
    const big = Math.max(e.w, e.h);

    // hairline circles, centred a little off the middle of the screen
    g!.lineWidth = 1;
    for (let i = 1; i <= 9; i++) {
      const r = big * 0.11 * i * (1 + 0.012 * Math.sin(e.t * 0.3 + i));
      g!.strokeStyle = rgba(ink, 0.05 + (i === 5 ? 0.05 : 0));
      g!.beginPath();
      g!.arc(cx, cy, r, 0, 6.2832);
      g!.stroke();
    }
    // arcs that turn at different speeds, and with the scroll
    for (let i = 0; i < 4; i++) {
      const r = big * (0.2 + i * 0.17);
      const a0 = e.t * (0.06 + i * 0.03) * (i % 2 ? -1 : 1) + e.scrollY * 0.0008 * (i + 1);
      g!.strokeStyle = rgba(ink, light ? 0.5 : 0.55);
      g!.lineWidth = 1.2;
      g!.beginPath();
      g!.arc(cx, cy, r, a0, a0 + 0.55 + i * 0.12);
      g!.stroke();
    }
    // a fine dot grid
    g!.fillStyle = rgba(ink, 0.12);
    for (let x = 0; x < e.w; x += 48) for (let y = ((-e.scrollY * 0.1) % 48 + 48) % 48; y < e.h; y += 48) g!.fillRect(x, y, 1.2, 1.2);

    if (fx) world.frame(fx, e);
    world.veil(g!, e, 0.5);

    // the cursor
    if (e.seen) {
      const x = e.mx;
      const y = e.my;
      const speed = Math.hypot(e.vx, e.vy);
      ringOpen += (14 + Math.min(46, speed / 40) - ringOpen) * 0.12;
      g!.strokeStyle = rgba(ink, 0.16);
      g!.lineWidth = 1;
      g!.beginPath();
      g!.moveTo(0, y + 0.5);
      g!.lineTo(e.w, y + 0.5);
      g!.moveTo(x + 0.5, 0);
      g!.lineTo(x + 0.5, e.h);
      g!.stroke();
      g!.strokeStyle = rgba(ink, 0.7);
      g!.beginPath();
      g!.arc(x, y, ringOpen + pulse, 0, 6.2832);
      g!.stroke();
      // readout: its place on the page, in tiny mono type
      g!.fillStyle = rgba(ink, 0.5);
      g!.font = "10px 'JetBrains Mono', monospace";
      g!.fillText(`${Math.round(x)} , ${Math.round(y)}`, x + ringOpen + 8, y - ringOpen - 6);
      pulse *= 0.9;
      if (!e.still) {
        trail.push({ x, y });
        if (trail.length > 26) trail.shift();
        for (let i = 1; i < trail.length; i++) {
          const k = i / trail.length;
          g!.strokeStyle = rgba(ink, k * 0.6);
          g!.lineWidth = k * 2.2;
          g!.beginPath();
          g!.moveTo(trail[i - 1].x, trail[i - 1].y);
          g!.lineTo(trail[i].x, trail[i].y);
          g!.stroke();
        }
      }
    }

    // grain, over everything
    g!.save();
    g!.globalAlpha = light ? 0.07 : 0.06;
    g!.globalCompositeOperation = light ? "multiply" : "screen";
    const ox = e.still ? 0 : Math.floor(Math.random() * 220);
    const oy = e.still ? 0 : Math.floor(Math.random() * 220);
    for (let x = -ox; x < e.w; x += 220) for (let y = -oy; y < e.h; y += 220) g!.drawImage(grain, x, y);
    g!.restore();
  }

  return {
    frame,
    resize: (e) => world.relayout(e),
    destroy: () => world.destroy(),
    press() {
      pulse = 30;
    },
  };
};

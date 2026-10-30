import * as THREE from "three";

import type { SceneEnv } from "../shared/scene/types";
import { modelKind, type ModelSpec, type ModelState, type Stage } from "../shared/scene/stage";
import type { Kind } from "../shared/scene/world";

/** A small canvas used as an emissive screen, redrawn a few times a second. */
function screen(w: number, h: number, paint: (g: CanvasRenderingContext2D, t: number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  let last = -1;
  return {
    tex,
    update(t: number) {
      if (t - last < 0.1) return;
      last = t;
      paint(g, t);
      tex.needsUpdate = true;
    },
  };
}

/** A retro desktop: a sunset gradient, a flat sun, a wireframe floor and one window with a title bar. */
function paintDesktop(g: CanvasRenderingContext2D, t: number, accent: string, accent2: string) {
  const { width: w, height: h } = g.canvas;
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#1a0b3a");
  sky.addColorStop(0.55, accent);
  sky.addColorStop(1, accent2);
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  const hy = h * 0.62;
  g.fillStyle = "#ffe9a8";
  g.beginPath();
  g.arc(w * 0.5, hy, h * 0.2, Math.PI, 0);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.8)";
  g.lineWidth = 1;
  const slide = (t * 0.25) % 1;
  for (let i = 0; i < 7; i++) {
    const z = (i + slide) / 7;
    const y = hy + (h - hy) * Math.pow(z, 1.8);
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  for (let i = -8; i <= 8; i++) {
    g.beginPath();
    g.moveTo(w / 2 + i * 2, hy);
    g.lineTo(w / 2 + i * (w / 7), h);
    g.stroke();
  }
  // a window
  g.fillStyle = "rgba(246,238,255,0.92)";
  g.fillRect(w * 0.08, h * 0.1, w * 0.34, h * 0.28);
  g.fillStyle = accent;
  g.fillRect(w * 0.08, h * 0.1, w * 0.34, h * 0.06);
  g.fillStyle = "#2a1450";
  for (let i = 0; i < 4; i++) g.fillRect(w * 0.1, h * (0.19 + i * 0.045), w * (0.14 + ((i * 7) % 4) * 0.04), 3);
}

function tint(model: THREE.Object3D, apply: (m: THREE.MeshStandardMaterial, mesh: THREE.Mesh) => void) {
  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => apply(m as THREE.MeshStandardMaterial, mesh));
  });
}

function turn(model: THREE.Group, state: ModelState & { data: Record<string, unknown> }, e: SceneEnv, x: number, y: number, sway: number, lookAt = 0.5) {
  const base = (state.data.yaw0 as number) ?? 0;
  const dx = e.seen ? Math.max(-1, Math.min(1, (e.mx - x) / (e.w * 0.5))) : 0;
  const dy = e.seen ? Math.max(-1, Math.min(1, (e.my - y) / (e.h * 0.5))) : 0;
  state.root.rotation.y = base + Math.sin(e.t * 0.3 + state.ph) * sway + dx * lookAt;
  state.root.rotation.x = ((state.data.pitch0 as number) ?? 0) + dy * 0.12;
  void model;
}

export function vaporModels(getStage: () => Stage | null, colors: () => { accent: string; accent2: string }): Kind[] {
  const specs: ModelSpec[] = [
    {
      id: "marble-bust",
      url: "/models/marble_bust_01.glb",
      radius: [90, 150],
      depth: [0.85, 1],
      zone: "side",
      weight: 3,
      pose: { yaw: [-0.5, 0.5] },
      tick: (m, s, e, x, y) => turn(m, s, e, x, y, 0.45, 0.6),
    },
    {
      id: "crt-television",
      url: "/models/Television_01.glb",
      radius: [90, 140],
      depth: [0.85, 1],
      zone: "side",
      weight: 3,
      pose: { yaw: [-0.35, 0.35] },
      setup(model, state, e) {
        // a glowing screen laid over the glass; it is found from the model's own bounds
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const c = colors();
        const scr = screen(256, 192, (g, t) => paintDesktop(g, t, c.accent, c.accent2));
        const glass = new THREE.Mesh(
          new THREE.PlaneGeometry(size.x * 0.56, size.y * 0.5),
          new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false }),
        );
        const centre = box.getCenter(new THREE.Vector3());
        glass.position.set(centre.x - size.x * 0.12, centre.y + size.y * 0.04, box.max.z + 0.002);
        model.add(glass);
        state.data.scr = scr;
        state.data.glass = glass;
      },
      tick(m, s, e, x, y) {
        (s.data.scr as { update(t: number): void } | undefined)?.update(e.t);
        turn(m, s, e, x, y, 0.3, 0.45);
      },
    },
    {
      id: "retro-laptop",
      url: "/models/classic_laptop.glb",
      radius: [90, 140],
      depth: [0.85, 1],
      weight: 2.4,
      pose: { yaw: [-0.5, 0.5], pitch: [0.15, 0.3] },
      setup(model, state) {
        const c = colors();
        const scr = screen(256, 192, (g, t) => paintDesktop(g, t, c.accent, c.accent2));
        tint(model, (m, mesh) => {
          if (/screen/i.test(m.name) || /screen/i.test(mesh.name)) {
            m.emissiveMap = scr.tex;
            m.emissive = new THREE.Color(0xffffff);
            m.emissiveIntensity = 1.2;
            m.map = null;
            m.needsUpdate = true;
          }
        });
        state.data.scr = scr;
      },
      tick(m, s, e, x, y) {
        (s.data.scr as { update(t: number): void } | undefined)?.update(e.t);
        turn(m, s, e, x, y, 0.35, 0.5);
      },
    },
    {
      id: "boombox",
      url: "/models/boombox.glb",
      radius: [80, 120],
      depth: [0.85, 1],
      weight: 2,
      pose: { yaw: [-0.5, 0.5] },
      tick: (m, s, e, x, y) => turn(m, s, e, x, y, 0.3, 0.5),
    },
    {
      id: "cassette-player",
      url: "/models/cassette_player.glb",
      radius: [60, 95],
      depth: [0.85, 1],
      weight: 1.6,
      pose: { yaw: [-0.6, 0.6], pitch: [-0.3, -0.1] },
      tick: (m, s, e, x, y) => turn(m, s, e, x, y, 0.4, 0.5),
    },
  ];
  // They stand on the top edges of the content cards, like ornaments on a shelf, and are a little larger
  // than before so the detail of the scans can be seen.
  for (const s of specs) {
    s.anchor = "ledge";
    s.radius = [s.radius[0] * 1.3, s.radius[1] * 1.3];
  }
  return specs.map((s) => modelKind(getStage, s)) as Kind[];
}

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

import type { SceneEnv } from "./types";
import type { Kind } from "./world";

/** The model stage: one WebGL canvas above the 2D layers where real 3D models (photogrammetry scans,
 * authored assets) are rendered with physically based materials and image-based lighting. It is
 * driven by the page world: a `modelKind` is an ordinary world kind whose update moves a model to the
 * place the world picked for it, so models share the layout rules (no overlap with text, unique
 * placement, depth bands, randomised every load) with everything else. */

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface Stage {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  key: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  ambient: THREE.HemisphereLight;
  loader: GLTFLoader;
  /** Marks a model as shown this frame; the rest are hidden before drawing. */
  frame: number;
  /** True while the last frame had something on it, so one more is drawn to clear it. */
  dirty: boolean;
  render(e: SceneEnv): void;
  resize(e: SceneEnv): void;
  destroy(): void;
}

export interface StageOptions {
  /** Colours of the key light, the fill and the sky/ground of the ambient light. */
  key?: number;
  fill?: number;
  sky?: number;
  ground?: number;
  exposure?: number;
  envIntensity?: number;
}

export function createStage(canvas: HTMLCanvasElement, e: SceneEnv, options: StageOptions = {}): Stage | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(e.dpr, 1.25));
  renderer.setSize(e.w, e.h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = options.exposure ?? 1.1;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = options.envIntensity ?? 0.9;

  const camera = new THREE.OrthographicCamera(-e.w / 2, e.w / 2, e.h / 2, -e.h / 2, -4000, 4000);
  camera.position.z = 1000;

  const key = new THREE.DirectionalLight(options.key ?? 0xfff2e0, 2.4);
  key.position.set(-300, 500, 700);
  const fill = new THREE.DirectionalLight(options.fill ?? 0x8aa8ff, 0.9);
  fill.position.set(400, -200, 400);
  const ambient = new THREE.HemisphereLight(options.sky ?? 0xbfd0ff, options.ground ?? 0x202030, 0.7);
  scene.add(key, fill, ambient);

  const stage: Stage = {
    scene,
    camera,
    renderer,
    key,
    fill,
    ambient,
    loader: new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),
    frame: 0,
    dirty: false,
    render(env2) {
      stage.frame++;
      // Nothing to draw, nothing to pay: the renderer only runs while a model is on screen.
      let shown = false;
      scene.traverse((o) => {
        if (!o.userData.stageRoot) return;
        o.visible = o.userData.seen === stage.frame - 1 || o.userData.seen === stage.frame;
        if (o.visible) shown = true;
      });
      void env2;
      if (shown || stage.dirty) {
        renderer.render(scene, camera);
        stage.dirty = shown;
      }
    },
    resize(env2) {
      renderer.setPixelRatio(Math.min(env2.dpr, 1.25));
      renderer.setSize(env2.w, env2.h, false);
      camera.left = -env2.w / 2;
      camera.right = env2.w / 2;
      camera.top = env2.h / 2;
      camera.bottom = -env2.h / 2;
      camera.updateProjectionMatrix();
    },
    destroy() {
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
  return stage;
}

/** Loads a glTF and returns it as a group fitted to a unit-radius sphere about the origin, so a world
 * radius of r pixels means "about 2r pixels across". */
export function loadModel(stage: Stage, url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    stage.loader.load(
      `${BASE}${url}`,
      (gltf) => {
        const inner = gltf.scene;
        const box = new THREE.Box3().setFromObject(inner);
        const size = box.getSize(new THREE.Vector3());
        const centre = box.getCenter(new THREE.Vector3());
        inner.position.sub(centre);
        const pivot = new THREE.Group();
        pivot.add(inner);
        const k = 2 / Math.max(size.x, size.y, size.z);
        pivot.scale.setScalar(k);
        const outer = new THREE.Group();
        outer.add(pivot);
        resolve(outer);
      },
      undefined,
      reject,
    );
  });
}

export interface ModelState {
  root: THREE.Group;
  inner: THREE.Group | null;
  ready: boolean;
  failed: boolean;
  ph: number;
  alpha: number;
  data: Record<string, unknown>;
}

export interface ModelSpec<D = Record<string, unknown>> {
  id: string;
  /** A glTF file under public/, or `build` for a model made in code (a textured planet, a polished sculpture). */
  url?: string;
  build?: (stage: Stage) => Promise<THREE.Group> | THREE.Group;
  anchor?: "ledge";
  weight?: number;
  radius: [number, number];
  depth: [number, number];
  zone?: "any" | "side" | "edge";
  band?: [number, number];
  /** Called once when the model has loaded: replace materials, add lights, build extras. */
  setup?(model: THREE.Group, state: ModelState & { data: D }, e: SceneEnv): void;
  /** Called every frame while it is on screen. `x`, `y`, `r` are its place and size on screen in px. */
  tick?(model: THREE.Group, state: ModelState & { data: D }, e: SceneEnv, x: number, y: number, r: number): void;
  /** Where the model rests: yaw/pitch/roll in radians, chosen at random within these ranges. */
  pose?: { yaw?: [number, number]; pitch?: [number, number]; roll?: [number, number] };
  reach?: number;
}

/** Turns a model spec into a world kind. The model is fetched the first time the world asks to show
 * it, so assets that are never placed (or never scrolled near) are never downloaded. */
export function modelKind<D = Record<string, unknown>>(getStage: () => Stage | null, spec: ModelSpec<D>): Kind<ModelState & { data: D }> {
  return {
    // a stage-driven kind never wastes the world's 2D draw

    id: spec.id,
    weight: spec.weight ?? 1,
    radius: spec.radius,
    depth: spec.depth,
    zone: spec.zone,
    band: spec.band,
    reach: spec.reach ?? 1.5,
    max: 1,
    anchor: spec.anchor,
    make(rnd) {
      const pose = spec.pose ?? {};
      const pick = (r?: [number, number]) => (r ? r[0] + rnd() * (r[1] - r[0]) : 0);
      const state = { root: new THREE.Group(), inner: null, ready: false, failed: false, ph: rnd() * Math.PI * 2, alpha: 1, data: {} as D } as ModelState & { data: D };
      state.root.userData.stageRoot = true;
      state.root.visible = false;
      state.root.rotation.set(pick(pose.pitch), pick(pose.yaw), pick(pose.roll));
      state.data = { ...(state.data as object), yaw0: state.root.rotation.y, pitch0: state.root.rotation.x, roll0: state.root.rotation.z } as D;
      return state;
    },
    update(state, e, x, y, r) {
      const stage = getStage();
      if (!stage || state.failed) return;
      if (!state.inner && !state.ready) {
        state.ready = true;
        Promise.resolve(spec.build ? spec.build(stage) : loadModel(stage, spec.url ?? ""))
          .then((model) => {
            state.inner = model;
            state.root.add(model);
            stage.scene.add(state.root);
            spec.setup?.(model, state, e);
          })
          .catch((error) => {
            state.failed = true;
            console.warn(`model ${spec.id} failed`, error);
          });
        return;
      }
      if (!state.inner) return;
      state.root.userData.seen = stage.frame;
      state.root.position.set(x - e.w / 2, e.h / 2 - y, 0);
      state.root.scale.setScalar(r);
      spec.tick?.(state.inner, state, e, x, y, r);
    },
    draw() {
      // the model is drawn by the stage
    },
  };
}

import * as THREE from "three";

import type { SceneEnv } from "../shared/scene/types";
import { loadModel, type Stage } from "../shared/scene/stage";

interface Parts {
  car: THREE.Group;
  wheels: THREE.Object3D[];
  under: THREE.PointLight;
}

/** The car: the Khronos "Car Concept" model (CC BY 4.0, Eric Chadwick), a clear-coated sports coupé,
 * shown from behind on the road. Its paint is recoloured, its tail lights are lit, its wheels turn,
 * and a cyan light under the floor throws a glow on the road. It sits on the road in the lane the
 * viewer is behind, rocking very slightly on its suspension. */
export function createCar(getStage: () => Stage | null) {
  let parts: Parts | null = null;
  let loading = false;
  const wheelSpin = { v: 0 };

  function init(stage: Stage) {
    loading = true;
    loadModel(stage, "/models/carconcept.glb")
      .then((car) => {
        const wheels: THREE.Object3D[] = [];
        car.traverse((o) => {
          if (/^Wheel/i.test(o.name) && !/Brake|Pad|Disc/i.test(o.name)) wheels.push(o);
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            const mat = m as THREE.MeshPhysicalMaterial;
            mat.transmission = 0;
            mat.iridescence = 0;
            mat.sheen = 0;
            if (/Glass|Windshield/i.test(mat.name) || /Windshield/i.test(o.name)) {
              mat.transparent = true;
              mat.opacity = 0.4;
            }
            if (/Paint/i.test(mat.name)) {
              // a deep magenta pearl, as on the cover of an eighties record
              mat.color = new THREE.Color(0x9a1760);
              mat.metalness = 0.65;
              mat.roughness = 0.28;
              mat.clearcoat = 1;
              mat.clearcoatRoughness = 0.04;
            }
            if (/Taillight|Headlight/i.test(o.name) || /Taillight|Headlight/i.test(mat.name)) {
              mat.emissive = new THREE.Color(/Head/i.test(o.name) ? 0xaef4ff : 0xff2030);
              mat.emissiveIntensity = 2.6;
            }
          });
        });
        const under = new THREE.PointLight(0x22e5ff, 6, 4);
        under.position.set(0, -0.9, 0);
        car.add(under);
        car.userData.stageRoot = true;
        car.visible = false;
        stage.scene.add(car);
        parts = { car, wheels, under };
      })
      .catch((error) => console.warn("car failed", error));
  }

  return {
    /** `cx` and `y` are where the car stands on the road, `size` how wide it is in px. */
    frame(e: SceneEnv, cx: number, y: number, size: number) {
      const stage = getStage();
      if (!stage) return;
      if (!parts) {
        if (!loading) init(stage);
        return;
      }
      const { car, wheels, under } = parts;
      car.userData.seen = stage.frame;
      car.position.set(cx - e.w / 2, e.h / 2 - y, 200);
      car.scale.setScalar(size * 0.5);
      // seen from behind, turned a little toward the cursor, rocking on its springs
      const look = e.seen ? Math.max(-1, Math.min(1, (e.mx - cx) / e.w)) : 0;
      car.rotation.set(0.1 + Math.sin(e.t * 1.7) * 0.004, Math.PI + look * 0.35 + Math.sin(e.t * 0.35) * 0.04, Math.sin(e.t * 1.1) * 0.006);
      wheelSpin.v += e.dt * 30;
      for (const w of wheels) w.rotation.x = wheelSpin.v;
      under.intensity = 5 + Math.sin(e.t * 2) * 0.6;
    },
  };
}

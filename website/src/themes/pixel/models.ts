import type { SceneEnv } from "../shared/scene/types";
import { modelKind, type ModelSpec, type ModelState, type Stage } from "../shared/scene/stage";
import type { Kind } from "../shared/scene/world";

type State = ModelState & { data: Record<string, unknown> };

/** A slow back-and-forth turn about the upright axis, like a display piece on a turntable. */
function sway(state: State, e: SceneEnv, amount: number) {
  const base = (state.data.yaw0 as number) ?? 0;
  state.root.rotation.y = base + Math.sin(e.t * 0.45 + state.ph) * amount;
}

/** Real retro hardware (scanned, CC0) standing on the cards among the pixel sprites: a wired gamepad and a classic console. */
export function pixelModels(getStage: () => Stage | null): Kind[] {
  const specs: ModelSpec[] = [
    {
      id: "gamepad",
      url: "/models/gamepad.glb",
      anchor: "ledge",
      radius: [70, 105],
      depth: [1, 1],
      weight: 3,
      pose: { yaw: [-0.5, 0.5], pitch: [0.35, 0.55] },
      tick: (_m, s, e) => sway(s, e, 0.4),
    },
    {
      id: "classic-console",
      url: "/models/classic_console.glb",
      anchor: "ledge",
      radius: [80, 120],
      depth: [1, 1],
      weight: 2.6,
      pose: { yaw: [-0.5, 0.5], pitch: [0.1, 0.25] },
      tick: (_m, s, e) => sway(s, e, 0.35),
    },
  ];
  return specs.map((s) => modelKind(getStage, s)) as Kind[];
}

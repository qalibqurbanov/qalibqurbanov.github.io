import type { StyleDefinition } from "../shared/types";

export const synthwave: StyleDefinition = {
  id: "synthwave",
  name: "Synthwave",
  description: "Neon night: a sunset horizon, a glowing grid that rushes toward you and light trails.",
  scene: () => import("./scene"),
};

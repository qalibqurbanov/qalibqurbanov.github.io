import type { StyleDefinition } from "../shared/types";

export const vaporwave: StyleDefinition = {
  id: "vaporwave",
  name: "Vaporwave",
  description: "Pastel dusk: a striped sun, a checkered floor and floating retro shapes that follow the cursor.",
  scene: () => import("./scene"),
};

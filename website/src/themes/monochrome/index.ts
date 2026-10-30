import type { StyleDefinition } from "../shared/types";

export const monochrome: StyleDefinition = {
  id: "monochrome",
  name: "Monochrome",
  description: "Black and white: grain, thin geometry and sharp contrast, with a precise cursor.",
  scene: () => import("./scene"),
};

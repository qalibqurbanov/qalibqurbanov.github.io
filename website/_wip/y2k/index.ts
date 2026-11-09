import type { StyleDefinition } from "../shared/types";

export const y2k: StyleDefinition = {
  id: "y2k",
  name: "Vintage Y2K",
  description: "A 2002 vision of the future: chrome, holographic surfaces, glossy interface details and a studio-lit sky.",
  scene: () => import("./scene"),
};

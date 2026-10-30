import type { StyleDefinition } from "../shared/types";

export const chrome: StyleDefinition = {
  id: "chrome",
  name: "Chrome",
  description: "Liquid metal: a flowing reflective surface with highlights that follow the cursor.",
  scene: () => import("./scene"),
};

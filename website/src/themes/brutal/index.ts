import type { StyleDefinition } from "../shared/types";

export const brutal: StyleDefinition = {
  id: "brutal",
  name: "Brutalist",
  description: "Loud and raw: thick black borders, hard offset shadows, flat colour blocks, huge type.",
  scene: () => import("./scene"),
};

import type { StyleDefinition } from "../shared/types";

export const industrial: StyleDefinition = {
  id: "industrial",
  name: "Industrial Metal",
  description: "An abandoned industrial venue: scratched steel, stage lights through smoke, hanging chains and masks. Original, not affiliated with any band.",
  scene: () => import("./scene"),
};

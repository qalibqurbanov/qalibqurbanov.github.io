import type { StyleDefinition } from "../shared/types";

export const pixel: StyleDefinition = {
  id: "pixel",
  name: "Pixel Quest",
  description: "16-bit: chunky pixels, a scrolling side-view landscape, cards like game menus.",
  scene: () => import("./scene"),
};

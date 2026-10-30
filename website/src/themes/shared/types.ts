import type { SceneFactory } from "./scene/types";

/** The module that holds a style's living background. */
export interface SceneModule {
  createScene: SceneFactory;
}

/** One visual style of the site: a folder under `themes/` with its own stylesheets. The colour
 * schemes (themes/shared/colour) work on top of any style. */
export interface StyleDefinition {
  /** The value of `data-style` on the root element while the style is active. */
  id: string;
  /** The name shown in the settings menu. */
  name: string;
  /** What the style is, in a few words. */
  description: string;
  /** The living background, loaded only while the style is active. The original style has none
   * of its own: its decoration is the set of components the app mounts for it. */
  scene?: () => Promise<SceneModule>;
}

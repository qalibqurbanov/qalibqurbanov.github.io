/** One visual style of the site: a folder under `themes/` with its own stylesheet. The colour
 * palettes (themes/shared/colour) work on top of any style. */
export interface StyleDefinition {
  /** The value of `data-style` on the root element while the style is active. */
  id: string;
  /** The name shown in the settings menu. */
  name: string;
  /** What the style is, in a few words. */
  description: string;
}

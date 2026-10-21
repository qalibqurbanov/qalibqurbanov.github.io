/** Lets any UI element (e.g. the Navbar's search button) open the palette without
 * prop-drilling open state through the tree — the palette itself owns the
 * only piece of state that matters (whether it's open). Kept apart from the
 * palette so that triggers do not pull its code into the first load. */
export const OPEN_COMMAND_PALETTE_EVENT = "portfolio:open-command-palette";

/** Alt+C, or "/" outside a text field. */
export function isPaletteShortcut(event: KeyboardEvent): boolean {
  if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.code === "KeyC") return true;
  const el = event.target as HTMLElement | null;
  const editable = el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || Boolean(el?.isContentEditable);
  return event.key === "/" && !editable;
}

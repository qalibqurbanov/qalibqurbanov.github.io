/** What counts as something to use, as CSS selectors. The custom cursor changes shape over these,
 * and the idle clock treats a pointer resting on one as not idle. */

/** Text the visitor can type into. */
export const FIELD =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]';

/** Things to click. */
export const LINK =
  'a[href], button:not(:disabled), summary, select, label[for], [role="button"], [role="tab"], [role="option"], [role="menuitem"], [role="radio"], [role="checkbox"], .cursor-pointer';

/** Things to drag. */
export const GRAB = ".cursor-grab, .cursor-grabbing";

/** Anything the visitor might be about to use. */
export const CLICKABLE = `${FIELD}, ${LINK}, ${GRAB}, input:not([type="hidden"])`;

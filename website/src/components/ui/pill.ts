/** The outlined pill of the two buttons under my name, shared with the buttons in the dialogs: a hairline with no fill, the label in the text
 * colour and the icon in the button's own colour. Pointed at, the hairline is lit by circling cyan and magenta light
 * (see `.btn-draw` in sidebar-card.css). Add `tone-blue` or `tone-violet` for the colour of the icon and the line. */
export const PILL =
  "btn-draw tap group relative isolate inline-flex h-[max(1.7rem,calc(2.5rem*var(--s,1)))] cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full border border-[color-mix(in_srgb,var(--tone)_26%,transparent)] px-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-text transition-colors duration-300 hover:border-[color-mix(in_srgb,var(--tone)_60%,transparent)] focus-visible:border-[var(--tone)]";
export const PILL_BLUE = `${PILL} tone-blue`;
export const PILL_PURPLE = `${PILL} tone-violet`;

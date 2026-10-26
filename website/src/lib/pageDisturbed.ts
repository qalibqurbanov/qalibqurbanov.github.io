/** Whether a page effect that shakes or tears the page is running right now (the glitch storm or
 * signal loss; see lib/effects.ts). While one is, elements slide out from under a mouse that has
 * not moved, and the browser answers with mouse-out and mouse-over events nobody caused. Floating
 * hints and menus ignore those, so an effect cannot close or move them. */
export function pageDisturbed(): boolean {
  const classes = document.documentElement.classList;
  return classes.contains("glitch-storm") || classes.contains("signal-loss");
}

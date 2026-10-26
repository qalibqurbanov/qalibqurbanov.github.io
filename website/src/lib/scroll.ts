/** Scrolls to the top of the page, clearing any hash/query from the URL. */

import { prefersReducedMotion } from "@/hooks/glitch";
export function scrollToTop(): void {
  const reduceMotion = prefersReducedMotion();
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });

  if (window.location.hash || window.location.search) {
    window.history.replaceState(null, "", window.location.pathname);
  }
}

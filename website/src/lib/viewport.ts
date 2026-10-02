const FALLBACK_NAVBAR_HEIGHT = 72;

/** `rootMargin` for an IntersectionObserver that treats the fixed navbar as
 * outside the screen, so something tucked underneath it counts as not visible. */
export function belowNavbarMargin(): string {
  const header = document.querySelector("header");
  const height = header ? Math.round(header.getBoundingClientRect().height) : FALLBACK_NAVBAR_HEIGHT;
  return `-${height || FALLBACK_NAVBAR_HEIGHT}px 0px 0px 0px`;
}

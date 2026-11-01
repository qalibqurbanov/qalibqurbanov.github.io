/** Whether this page is the site's 404 page. GitHub Pages answers every unknown address with the
 * same build of the site, which marks itself with `data-page="not-found"` on the root element
 * (see config/localized-html.ts), and the app then shows its not-found view instead of the sections. */
export function isNotFoundPage(): boolean {
  return document.documentElement.getAttribute("data-page") === "not-found";
}

/** Whether this page is the /links page: the same site around a list of links, built as its own
 * HTML file (see config/localized-html.ts) and marked `data-page="links"`. */
export function isLinksPage(): boolean {
  return document.documentElement.getAttribute("data-page") === "links";
}

/** The pages that sit outside the language paths (/en/, /az/, /ru/) and have no sections to scroll to.
 * They take the visitor's language and change it in place, without moving the address. */
export function isStandalonePage(): boolean {
  return isNotFoundPage() || isLinksPage();
}

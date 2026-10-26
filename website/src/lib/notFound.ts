/** Whether this page is the site's 404 page. GitHub Pages answers every unknown address with the
 * same build of the site, which marks itself with `data-page="not-found"` on the root element
 * (see config/localized-html.ts), and the app then shows its not-found view instead of the sections. */
export function isNotFoundPage(): boolean {
  return document.documentElement.getAttribute("data-page") === "not-found";
}

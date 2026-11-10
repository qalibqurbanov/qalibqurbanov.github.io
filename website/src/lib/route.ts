// Where the visitor is, as far as the full-page views are concerned. Each project has its own address
// (/en/projects/imager/) so search engines can index it; the resume view keeps its reserved `#/resume` hash.
// Plain section anchors (`#about`) are left alone. Kept free of imports so the language code can use it too.

const PROJECT_PATH = /^\/([a-z]{2})\/projects\/([^/]+)\/?$/;
const LEGACY_PROJECT_HASH = "#/project/";
const ROUTE_EVENT = "portfolio:route";

/** The project named by the address bar, or null. */
export function projectSlugFromPath(pathname: string): string | null {
  const match = PROJECT_PATH.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[2]);
  } catch {
    return match[2];
  }
}

/** The language segment of the address (`/az/...`), if it has one. */
export function languageFromPath(pathname: string): string | null {
  return /^\/([a-z]{2})(\/|$)/.exec(pathname)?.[1] ?? null;
}

export function projectPath(slug: string, locale: string): string {
  return `/${locale}/projects/${encodeURIComponent(slug)}/`;
}

/** Tells every part of the page that the address changed without a `popstate` (after a push or replace). */
export function notifyRouteChange(): void {
  window.dispatchEvent(new Event(ROUTE_EVENT));
}

export function subscribeRoute(listener: () => void): () => void {
  window.addEventListener("popstate", listener);
  window.addEventListener("hashchange", listener);
  window.addEventListener(ROUTE_EVENT, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener("hashchange", listener);
    window.removeEventListener(ROUTE_EVENT, listener);
  };
}

/** One string that changes whenever the address does, for `useSyncExternalStore`. */
export function routeSnapshot(): string {
  return window.location.pathname + window.location.hash;
}

/** Old links (`/en/#/project/imager`) become the project's real address, without a new history entry. */
export function migrateLegacyProjectHash(): void {
  const { pathname, hash } = window.location;
  if (!hash.startsWith(LEGACY_PROJECT_HASH)) return;
  const language = languageFromPath(pathname);
  if (!language) return;
  const slug = decodeURIComponent(hash.slice(LEGACY_PROJECT_HASH.length));
  window.history.replaceState(null, "", projectPath(slug, language));
}

// A section anchor clicked while a project is open (`/en/projects/imager/#about`) means "leave the project":
// the address goes back to the home page of that language with the same anchor.
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    if (window.location.hash.startsWith(LEGACY_PROJECT_HASH)) {
      migrateLegacyProjectHash();
      notifyRouteChange();
      return;
    }
    const { pathname, hash } = window.location;
    if (!projectSlugFromPath(pathname) || hash.length < 2 || hash.startsWith("#/")) return;
    const language = languageFromPath(pathname);
    if (!language) return;
    window.history.replaceState(null, "", `/${language}/${hash}`);
    notifyRouteChange();
  });
}

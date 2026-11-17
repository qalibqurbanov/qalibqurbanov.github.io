import { useCallback, useSyncExternalStore } from "react";

import { currentPage, resumePage, type Page } from "@/hooks/usePage";
import { DEFAULT_LOCALE, localeFromPath, pathForLocale } from "@/i18n/locale";
import { isNotFoundPage } from "@/lib/notFound";
import { parseViewPath, viewPath } from "@/lib/viewPath";

// Deliberately not a routing library: the pages of the site (#about, #projects…) are hashes that
// the site reads itself. The full-page views have real addresses instead: a project is
// /en/projects/<slug>/ and an article /en/blog/<slug>/, which the build also writes as pages of their own, so
// each can be found and shared. The resume viewer keeps a reserved `#/…` hash.

/** The resume's link names the page it was opened from (`#/links/resume`), so closing it comes back there. */
export function resumeHref(page: Page = currentPage()): string {
  return `#/${page}/resume`;
}

export function blogHref(slug: string): string {
  return viewPath("blog", slug);
}

export function projectHref(slug: string): string {
  return viewPath("projects", slug);
}

interface Route {
  slug: string | null;
  postSlug: string | null;
  resumeOpen: boolean;
}

const LEGACY_PROJECT = "#/project/";
const LEGACY_BLOG = "#/blog/";

/** Links from before the views had addresses of their own (`/en/#/project/imager`) open the new address. */
function upgradeLegacyHash(): void {
  const { hash, pathname } = window.location;
  const kind = hash.startsWith(LEGACY_PROJECT) ? "projects" : hash.startsWith(LEGACY_BLOG) ? "blog" : null;
  if (!kind) return;
  const slug = decodeURIComponent(hash.slice((kind === "projects" ? LEGACY_PROJECT : LEGACY_BLOG).length));
  window.history.replaceState(null, "", viewPath(kind, slug, localeFromPath(pathname) ?? DEFAULT_LOCALE));
}

function readRoute(): Route {
  const { pathname, hash } = window.location;
  // The 404 page is served at the address that was not found, which must not open a view.
  const view = isNotFoundPage() ? null : parseViewPath(pathname);
  return {
    slug: view?.kind === "projects" ? view.slug : null,
    postSlug: view?.kind === "blog" ? view.slug : null,
    resumeOpen: resumePage(hash) !== null,
  };
}

const empty: Route = { slug: null, postSlug: null, resumeOpen: false };
let route: Route = empty;
const listeners = new Set<() => void>();

function refresh(): void {
  const next = readRoute();
  if (next.slug === route.slug && next.postSlug === route.postSlug && next.resumeOpen === route.resumeOpen) return;
  route = next;
  listeners.forEach((listener) => listener());
}

/** Moves to an address of the site without reloading, and lets the views follow. */
function go(url: string): void {
  if (window.location.pathname + window.location.search + window.location.hash !== url) window.history.pushState(null, "", url);
  refresh();
}

if (typeof window !== "undefined") {
  upgradeLegacyHash();
  route = readRoute();
  window.addEventListener("popstate", refresh);
  window.addEventListener("hashchange", refresh);

  // A link to a project or an article is an ordinary link (so it can be opened in a new tab or copied), but a
  // plain click stays in the page instead of loading the built page again.
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || (link.target && link.target !== "_self") || link.origin !== window.location.origin) return;
    if (!parseViewPath(link.pathname)) return;
    event.preventDefault();
    go(link.pathname);
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProjectRoute() {
  const current = useSyncExternalStore(subscribe, () => route, () => empty);

  const openProject = useCallback((slug: string) => go(projectHref(slug)), []);

  const openResume = useCallback(() => {
    window.location.hash = resumeHref();
  }, []);

  const openPost = useCallback((slug: string) => go(blogHref(slug)), []);

  /** Leaves whichever full-page view is open and returns to the main page. */
  const closeProject = useCallback(() => {
    // Go back to the page the view was opened over (`#links`, `#projects`…) instead of an empty
    // hash, so the address keeps matching what is on screen.
    const { pathname, search } = window.location;
    const base = parseViewPath(pathname) ? pathForLocale(localeFromPath(pathname) ?? DEFAULT_LOCALE) : pathname;
    window.history.pushState(null, "", `${base}${search}#${currentPage()}`);
    route = empty;
    listeners.forEach((listener) => listener());
  }, []);

  return {
    activeSlug: current.slug,
    postSlug: current.postSlug,
    resumeOpen: current.resumeOpen,
    openProject,
    openPost,
    openResume,
    closeProject,
  };
}

import type { MouseEvent } from "react";
import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  languageFromPath,
  notifyRouteChange,
  projectPath,
  projectSlugFromPath,
  routeSnapshot,
  subscribeRoute,
} from "@/lib/route";

// Deliberately not a routing library: the home page has a lot of in-page `#about`/`#projects` anchors that
// a router would treat as route changes. Each project has its own real address (/en/projects/imager/),
// shared with search engines; the resume view keeps its reserved `#/resume` hash.
export const RESUME_HREF = "#/resume";

/** The real address of a project's page in a language. */
export function projectHref(slug: string, locale: string): string {
  return projectPath(slug, locale);
}

interface Route {
  slug: string | null;
  resumeOpen: boolean;
}

function readRoute(): Route {
  const { pathname, hash } = window.location;
  return { slug: projectSlugFromPath(pathname), resumeOpen: hash === RESUME_HREF };
}

/** Lets a plain click on a project link open it in the page; modified clicks (new tab, etc.) follow the real address. */
export function isPlainClick(event: MouseEvent): boolean {
  return !(event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
}

export function useProjectRoute() {
  const snapshot = useSyncExternalStore(subscribeRoute, routeSnapshot, () => "/");
  const route = useMemo<Route>(readRoute, [snapshot]);

  const openProject = useCallback((slug: string) => {
    const language = languageFromPath(window.location.pathname) ?? "en";
    window.history.pushState(null, "", projectPath(slug, language));
    notifyRouteChange();
  }, []);

  const openResume = useCallback(() => {
    window.location.hash = RESUME_HREF;
  }, []);

  /** Leaves whichever full-page view is open and returns to the home page of the same language. */
  const closeProject = useCallback(() => {
    const language = languageFromPath(window.location.pathname) ?? "en";
    window.history.pushState(null, "", `/${language}/${window.location.search}`);
    notifyRouteChange();
  }, []);

  return {
    activeSlug: route.slug,
    resumeOpen: route.resumeOpen,
    openProject,
    openResume,
    closeProject,
  };
}

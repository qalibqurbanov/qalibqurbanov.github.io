import { useCallback, useEffect, useState } from "react";

// Deliberately not a routing library: react-router's HashRouter would treat
// every `#about`/`#projects` in-page anchor as a route change and swallow
// the site's existing scroll navigation. Full-page views (project case
// studies, the resume viewer) get their own reserved `#/…` hashes instead,
// so plain section anchors are left alone.
const PROJECT_HASH_PREFIX = "#/project/";
export const RESUME_HREF = "#/resume";

export function projectHref(slug: string): string {
  return `${PROJECT_HASH_PREFIX}${encodeURIComponent(slug)}`;
}

interface Route {
  slug: string | null;
  resumeOpen: boolean;
}

function readRoute(): Route {
  const { hash } = window.location;
  return {
    slug: hash.startsWith(PROJECT_HASH_PREFIX)
      ? decodeURIComponent(hash.slice(PROJECT_HASH_PREFIX.length))
      : null,
    resumeOpen: hash === RESUME_HREF,
  };
}

export function useProjectRoute() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    function handleHashChange() {
      setRoute(readRoute());
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const openProject = useCallback((slug: string) => {
    window.location.hash = projectHref(slug);
  }, []);

  const openResume = useCallback(() => {
    window.location.hash = RESUME_HREF;
  }, []);

  /** Leaves whichever full-page view is open and returns to the main page. */
  const closeProject = useCallback(() => {
    // Strip the hash without leaving a history entry that would immediately
    // re-open the view if the visitor hits Back.
    window.history.pushState(null, "", window.location.pathname + window.location.search);
    setRoute({ slug: null, resumeOpen: false });
  }, []);

  return {
    activeSlug: route.slug,
    resumeOpen: route.resumeOpen,
    openProject,
    openResume,
    closeProject,
  };
}

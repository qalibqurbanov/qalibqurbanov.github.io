import { useCallback, useEffect, useState } from "react";

// Deliberately not a routing library: react-router's HashRouter would treat
// every `#about`/`#projects` in-page anchor as a route change and swallow
// the site's existing scroll navigation. Project case studies get their own
// reserved hash prefix instead, so plain section anchors are left alone.
const PROJECT_HASH_PREFIX = "#/project/";

export function projectHref(slug: string): string {
  return `${PROJECT_HASH_PREFIX}${encodeURIComponent(slug)}`;
}

function readSlugFromHash(): string | null {
  const { hash } = window.location;
  return hash.startsWith(PROJECT_HASH_PREFIX)
    ? decodeURIComponent(hash.slice(PROJECT_HASH_PREFIX.length))
    : null;
}

export function useProjectRoute() {
  const [activeSlug, setActiveSlug] = useState<string | null>(readSlugFromHash);

  useEffect(() => {
    function handleHashChange() {
      setActiveSlug(readSlugFromHash());
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const openProject = useCallback((slug: string) => {
    window.location.hash = projectHref(slug);
  }, []);

  const closeProject = useCallback(() => {
    // Strip the hash without leaving a history entry that would immediately
    // re-open the project if the visitor hits Back.
    window.history.pushState(null, "", window.location.pathname + window.location.search);
    setActiveSlug(null);
    window.scrollTo(0, 0);
  }, []);

  return { activeSlug, openProject, closeProject };
}

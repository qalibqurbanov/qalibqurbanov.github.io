import { useEffect, useState, useSyncExternalStore } from "react";

import { prefersReducedMotion } from "@/lib/motion";
import { isNotFoundPage } from "@/lib/notFound";
import { parseViewPath } from "@/lib/viewPath";

/** The pages of the site, in the order of the menu. Each is one section shown on its own. The last, Links, is not in the menu:
 * it is opened from the picture. */
export const PAGES = ["home", "about", "experience", "projects", "skills", "blog", "contact", "links"] as const;
export type Page = (typeof PAGES)[number];

const FIRST: Page = "home";

/** How long the page being left takes to slide away (see `.page-leave` in theme.css). */
const LEAVE_MS = 240;

function fromHash(): Page | null {
  const id = window.location.hash.slice(1);
  return (PAGES as readonly string[]).includes(id) ? (id as Page) : null;
}

/** The page behind a full-page view that is opened by a link: a project sits on Projects, an article on Writing. */
function initialPage(): Page {
  const { hash, pathname } = window.location;
  const view = isNotFoundPage() ? null : parseViewPath(pathname);
  if (view) return view.kind;
  if (hash.startsWith("#/project/")) return "projects";
  if (hash.startsWith("#/blog/")) return "blog";
  const resumeOn = resumePage(hash);
  if (resumeOn) return resumeOn;
  return fromHash() ?? FIRST;
}

/** The page behind the resume viewer, from a hash like `#/links/resume`; null when the hash is not a resume one. */
export function resumePage(hash: string): Page | null {
  const match = /^#\/([a-z]+)\/resume$/.exec(hash);
  if (match && (PAGES as readonly string[]).includes(match[1])) return match[1] as Page;
  return hash === "#/resume" ? FIRST : null;
}

/** The page behind whatever is open now (not a hook: for event handlers). */
export function currentPage(): Page {
  return current;
}

let current: Page = typeof window === "undefined" ? FIRST : initialPage();
const listeners = new Set<() => void>();

// A link to a page (#projects) changes the page that is wanted. Hashes of the full-page views
// (#/project/…) are not pages, so the page underneath stays as it was.
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    const next = fromHash();
    if (!next || next === current) return;
    current = next;
    listeners.forEach((listener) => listener());
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The page the visitor has asked for. The menu follows this at once. */
export function usePage(): Page {
  return useSyncExternalStore(subscribe, () => current);
}

export interface PageSwitch {
  /** The page whose content is on screen right now (it trails `wanted` by the length of the exit animation). */
  shown: Page;
  /** True while the shown page is sliding away and the wanted one has not come in yet. */
  leaving: boolean;
  /** 1 when the move is down the menu, -1 when it is up: the pages slide the way the menu item lies. */
  direction: 1 | -1;
}

/** Plays a page change in two steps: the page on screen slides away, then the wanted one comes in. */
export function usePageSwitch(): PageSwitch {
  const wanted = usePage();
  const [state, setState] = useState<{ shown: Page; direction: 1 | -1 }>({ shown: wanted, direction: 1 });
  const { shown } = state;

  useEffect(() => {
    if (wanted === shown) return;
    const apply = () => {
      window.scrollTo({ top: 0, behavior: "auto" });
      setState({ shown: wanted, direction: PAGES.indexOf(wanted) > PAGES.indexOf(shown) ? 1 : -1 });
    };
    const timer = window.setTimeout(apply, prefersReducedMotion() ? 0 : LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [wanted, shown]);

  // While leaving, the direction is that of the move that is under way.
  const direction = wanted === shown ? state.direction : PAGES.indexOf(wanted) > PAGES.indexOf(shown) ? 1 : -1;
  return { shown, leaving: wanted !== shown, direction };
}

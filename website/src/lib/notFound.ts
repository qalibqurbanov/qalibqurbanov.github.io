import { useSyncExternalStore } from "react";

/** Whether this page is the site's 404 page. GitHub Pages answers every unknown address with the
 * same build of the site, which marks itself with `data-page="not-found"` on the root element
 * (see config/localized-html.ts). The site itself is shown as usual, with the 404 notice in a panel
 * at its right side that the visitor can close (see `dismissNotFound`). */
export function isNotFoundPage(): boolean {
  return document.documentElement.getAttribute("data-page") === "not-found";
}

/** The address that was not found, kept after the panel is closed and the address bar is repaired. */
export const missingPath = typeof window === "undefined" ? "" : window.location.pathname;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True while the 404 panel is to be shown; follows `dismissNotFound`. */
export function useNotFound(): boolean {
  return useSyncExternalStore(subscribe, isNotFoundPage, () => false);
}

/** Closes the 404 panel and points the address bar at the real page of `home` (keeping the hash),
 * so the address matches what is on screen from then on. */
export function dismissNotFound(home: string): void {
  if (!isNotFoundPage()) return;
  document.documentElement.removeAttribute("data-page");
  window.history.replaceState(null, "", `${home}${window.location.hash}`);
  listeners.forEach((listener) => listener());
}

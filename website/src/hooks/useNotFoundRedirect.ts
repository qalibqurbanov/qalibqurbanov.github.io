import { useEffect } from "react";

import { pathForLocale } from "@/i18n/locale";
import type { Locale } from "@/i18n/locale";
import { isNotFoundPage } from "@/lib/notFound";

/** On the 404 page there are no sections, projects or resume view to scroll to. The navbar, the
 * command palette and the footer still point at them with `#…` addresses, so a click on any of them
 * takes the visitor to the real page at that spot instead. */
export function useNotFoundRedirect(locale: Locale): void {
  useEffect(() => {
    if (!isNotFoundPage()) return;
    // Clicks are caught first so the address goes straight to the real page and never shows the
    // 404 path with a `#…` appended on the way.
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      const href = anchor?.getAttribute("href");
      if (!href || href.length < 2 || !href.startsWith("#")) return;
      event.preventDefault();
      window.location.replace(pathForLocale(locale) + href);
    }
    function handleHashChange() {
      if (window.location.hash.length > 1) window.location.replace(pathForLocale(locale) + window.location.hash);
    }
    document.addEventListener("click", handleClick, true);
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [locale]);
}

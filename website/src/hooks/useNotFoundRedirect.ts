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
    function handleHashChange() {
      if (window.location.hash.length > 1) window.location.assign(pathForLocale(locale) + window.location.hash);
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [locale]);
}

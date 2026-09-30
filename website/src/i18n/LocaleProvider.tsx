import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { loadContent } from "@/content";
import type { Content } from "@/types/content";

import { LocaleContext, type LocaleContextValue } from "./context";
import { type Locale, localeFromUrl, navigateToLocale, storeLocale } from "./locale";

interface LocaleProviderProps {
  /** Locale resolved before first render — see `resolveInitialLocale`. */
  initialLocale: Locale;
  /** Already-loaded content for `initialLocale`, so first paint never waits. */
  initialContent: Content;
  children: ReactNode;
}

export function LocaleProvider({ initialLocale, initialContent, children }: LocaleProviderProps) {
  // locale and content change together, only once the new chunk has arrived,
  // so the page keeps showing the old language instead of flashing empty.
  const [state, setState] = useState({ locale: initialLocale, content: initialContent });
  const latestRequest = useRef<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = state.locale;
    const { name, role } = state.content.profile;
    document.title = `${name} | ${role}`;
  }, [state]);

  const switchTo = useCallback(async (next: Locale) => {
    latestRequest.current = next;
    try {
      const content = await loadContent(next);
      // A newer switch (or Back/Forward) may have started while this loaded.
      if (latestRequest.current === next) setState({ locale: next, content });
    } catch {
      // Chunk failed to load: stay on the current language; the URL is
      // reverted by the caller's next successful navigation.
    }
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      storeLocale(next);
      navigateToLocale(next, "push");
      void switchTo(next);
    },
    [switchTo],
  );

  // Back/Forward between /, /az/ and /ru/ changes the path without a reload.
  useEffect(() => {
    function handlePopState() {
      void switchTo(localeFromUrl());
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [switchTo]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale: state.locale, setLocale, content: state.content }),
    [state, setLocale],
  );

  return <LocaleContext value={value}>{children}</LocaleContext>;
}

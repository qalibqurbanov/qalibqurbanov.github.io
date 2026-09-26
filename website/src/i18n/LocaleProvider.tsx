import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { contentByLocale } from "@/content";

import { LocaleContext, type LocaleContextValue } from "./context";
import { type Locale, detectInitialLocale, storeLocale } from "./locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    storeLocale(next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, content: contentByLocale[locale] }),
    [locale, setLocale],
  );

  return <LocaleContext value={value}>{children}</LocaleContext>;
}

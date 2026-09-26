import { createContext, use } from "react";

import type { Content } from "@/types/content";

import type { Locale } from "./locale";

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  content: Content;
}

export const LocaleContext = createContext<LocaleContextValue | null>(null);

function useLocaleContext(): LocaleContextValue {
  const context = use(LocaleContext);
  if (!context) {
    throw new Error("useLocaleContext must be used within a LocaleProvider");
  }
  return context;
}

/** The active locale content tree — everything a component renders. */
export function useContent(): Content {
  return useLocaleContext().content;
}

/** The active locale code plus a setter, for the language switcher and date formatting. */
export function useLocale(): { locale: Locale; setLocale: (locale: Locale) => void } {
  const { locale, setLocale } = useLocaleContext();
  return { locale, setLocale };
}

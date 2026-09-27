export type Locale = "en" | "az" | "ru";

export interface LocaleMeta {
  code: Locale;
  /** English name, used as a fallback/tooltip. */
  label: string;
  /** Name written in the language itself, shown in the switcher. */
  nativeLabel: string;
  /** BCP-47 tag for Intl APIs (Intl.DateTimeFormat, etc.). */
  bcp47: string;
}

export const SUPPORTED_LOCALES: LocaleMeta[] = [
  { code: "az", label: "Azerbaijani", nativeLabel: "AZ", bcp47: "az-Latn-AZ" },
  { code: "ru", label: "Russian", nativeLabel: "RU", bcp47: "ru-RU" },
  { code: "en", label: "English", nativeLabel: "EN", bcp47: "en-US" },
];

export const DEFAULT_LOCALE: Locale = "en";

const LOCALE_STORAGE_KEY = "portfolio:locale";

const SUPPORTED_CODES: readonly string[] = SUPPORTED_LOCALES.map((meta) => meta.code);

export function isLocale(value: string): value is Locale {
  return SUPPORTED_CODES.includes(value);
}

export function getLocaleMeta(locale: Locale): LocaleMeta {
  return SUPPORTED_LOCALES.find((meta) => meta.code === locale) ?? SUPPORTED_LOCALES[0];
}

export function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored && isLocale(stored) ? stored : null;
  } catch {
    // localStorage can throw in private-browsing/storage-disabled contexts.
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore write failures — the site still works, it just won't remember the choice.
  }
}

export function detectBrowserLocale(): Locale {
  const candidates = window.navigator.languages ?? [window.navigator.language];
  for (const candidate of candidates) {
    const primary = candidate.slice(0, 2).toLowerCase();
    if (isLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

export function detectInitialLocale(): Locale {
  return readStoredLocale() ?? detectBrowserLocale();
}

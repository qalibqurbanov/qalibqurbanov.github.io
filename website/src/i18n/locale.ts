export type Locale = "en" | "az" | "ru";

export interface LocaleMeta {
  code: Locale;
  /** English name, used as a fallback/tooltip. */
  label: string;
  /** Full name written in the language itself, used in messages and menus. */
  nativeName: string;
  /** Short code shown in the switcher. */
  nativeLabel: string;
  /** BCP-47 tag for Intl APIs (Intl.DateTimeFormat, etc.). */
  bcp47: string;
}

export const SUPPORTED_LOCALES: LocaleMeta[] = [
  { code: "az", label: "Azerbaijani", nativeName: "Azərbaycanca", nativeLabel: "AZ", bcp47: "az-Latn-AZ" },
  { code: "ru", label: "Russian", nativeName: "Русский", nativeLabel: "RU", bcp47: "ru-RU" },
  { code: "en", label: "English", nativeName: "English", nativeLabel: "EN", bcp47: "en-US" },
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

// Every locale lives under its own path prefix (`/en/`, `/az/`, `/ru/`) so each
// language has its own crawlable URL. The bare root `/` is only a landing shim that redirects to one of them.
// The site is served from the domain root (see `base` in vite.config.ts).

/** The locale named by the first path segment, or null when there is none. */
export function localeFromPath(pathname: string): Locale | null {
  const segment = pathname.split("/")[1]?.toLowerCase() ?? "";
  return isLocale(segment) ? segment : null;
}

export function pathForLocale(locale: Locale): string {
  return `/${locale}/`;
}

/** The locale the current URL asks for; anything else (a bare `/`) falls back to the default. */
export function localeFromUrl(): Locale {
  return localeFromPath(window.location.pathname) ?? DEFAULT_LOCALE;
}

/**
 * Points the address bar at `locale`'s path, keeping query and hash. Uses
 * replaceState for the initial redirect so Back doesn't bounce off it.
 */
export function navigateToLocale(locale: Locale, mode: "push" | "replace"): void {
  const { pathname, search, hash } = window.location;
  const target = pathForLocale(locale);
  if (pathname === target) return;
  const url = `${target}${search}${hash}`;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

/**
 * Decides the locale before first render. A localized path always wins. On a
 * bare `/`, a remembered choice or the browser's language takes the visitor
 * to their language's URL (crawlers send neither, so they land on English).
 */
export function resolveInitialLocale(): Locale {
  const fromPath = localeFromPath(window.location.pathname);
  if (fromPath) return fromPath;
  if (window.location.pathname !== "/") return DEFAULT_LOCALE;
  const preferred = detectInitialLocale();
  navigateToLocale(preferred, "replace");
  return preferred;
}

import { DEFAULT_LOCALE, isLocale, localeFromPath, type Locale } from "@/i18n/locale";

/** The full-page views that have an address of their own: a project and an article. The build writes a real
 * page at each (see config/localized-html.ts), so the same address works when opened fresh. */
export type ViewKind = "projects" | "blog";

const KINDS: readonly string[] = ["projects", "blog"];

/** The view an address points at, e.g. `/en/projects/imager/` is the project "imager"; null for anything else. */
export function parseViewPath(pathname: string): { kind: ViewKind; slug: string } | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] && isLocale(parts[0])) parts.shift();
  if (parts.length !== 2 || !KINDS.includes(parts[0])) return null;
  try {
    return { kind: parts[0] as ViewKind, slug: decodeURIComponent(parts[1]) };
  } catch {
    return null;
  }
}

/** The address of a view in a language (the language of the current address by default). */
export function viewPath(kind: ViewKind, slug: string, locale?: Locale): string {
  const code = locale ?? (typeof window === "undefined" ? DEFAULT_LOCALE : (localeFromPath(window.location.pathname) ?? DEFAULT_LOCALE));
  return `/${code}/${kind}/${encodeURIComponent(slug)}/`;
}

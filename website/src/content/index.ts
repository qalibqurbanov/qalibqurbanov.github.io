import type { Locale } from "@/i18n/locale";
import type { Content } from "@/types/content";

/**
 * One dynamic import per locale, so each language ships as its own chunk and
 * a visitor only downloads the one they're reading. Because every tree
 * satisfies the same `Content` interface, a missed translation is still a
 * type error. To add a language: add its code to `Locale` (i18n/locale.ts),
 * write a `Content` tree in its own file, and register the loader below.
 */
const loaders: Record<Locale, () => Promise<{ default: Content }>> = {
  en: () => import("./en"),
  az: () => import("./az"),
  ru: () => import("./ru"),
};

const cache = new Map<Locale, Promise<Content>>();

export function loadContent(locale: Locale): Promise<Content> {
  let pending = cache.get(locale);
  if (!pending) {
    pending = loaders[locale]().then((module) => module.default);
    // Don't cache failures — let a later switch retry (e.g. after a flaky network).
    pending.catch(() => cache.delete(locale));
    cache.set(locale, pending);
  }
  return pending;
}

import type { Locale } from "@/i18n/locale";
import type { Content } from "@/types/content";

import { az } from "./az";
import { en } from "./en";
import { ru } from "./ru";

/**
 * One fully-typed `Content` tree per locale. Because every locale module
 * satisfies the same `Content` interface, TypeScript itself guarantees no
 * locale is missing a field the others have — a missed translation is a
 * type error, not a silent gap on the page.
 */
export const contentByLocale: Record<Locale, Content> = { en, az, ru };

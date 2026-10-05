import { careerStart } from "@/content/shared";
import type { Locale } from "@/i18n/locale";
import type { Content } from "@/types/content";

import { wholeYearsSince, yearWord } from "./duration";

/** Whole years of career as of `now` — the only number the copy derives. */
export function careerYears(now: Date): number {
  return wholeYearsSince(careerStart, now);
}

/** Fills the `{years}` ("3+") and `{yearUnit}` ("years"/"года"/"лет")
 * placeholders in the About copy, so the figures follow the calendar instead
 * of being typed in and going stale. */
export function withLiveStats(content: Content, locale: Locale, years: number): Content {
  const fill = (text: string) =>
    text.replaceAll("{years}", `${years}+`).replaceAll("{yearUnit}", yearWord(years, locale));

  return {
    ...content,
    about: {
      ...content.about,
      paragraphs: content.about.paragraphs.map(fill),
      highlights: content.about.highlights.map((item) => ({ ...item, value: fill(item.value) })),
    },
  };
}

import type { Locale } from "@/i18n/locale";

type Forms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

const UNITS: Record<Locale, { year: Forms; month: Forms }> = {
  en: {
    year: { one: "year", other: "years" },
    month: { one: "month", other: "months" },
  },
  ru: {
    year: { one: "год", few: "года", many: "лет", other: "лет" },
    month: { one: "месяц", few: "месяца", many: "месяцев", other: "месяцев" },
  },
  az: {
    year: { other: "il" },
    month: { other: "ay" },
  },
};

function unit(count: number, forms: Forms, locale: Locale): string {
  const category = new Intl.PluralRules(locale).select(count);
  return `${count} ${forms[category] ?? forms.other}`;
}

function toMonthIndex(value: string): number {
  const [year, month] = value.split("-").map(Number);
  return year * 12 + (month - 1);
}

/** Whole years since `start` ("YYYY-MM"), as of `now`. */
export function wholeYearsSince(start: string, now: Date): number {
  const monthsIn = now.getFullYear() * 12 + now.getMonth() - toMonthIndex(start);
  return Math.max(0, Math.floor(monthsIn / 12));
}

/** The word for `count` years in `locale`, e.g. "года" for 3 in Russian. */
export function yearWord(count: number, locale: Locale): string {
  const forms = UNITS[locale].year;
  return forms[new Intl.PluralRules(locale).select(count)] ?? forms.other;
}

/** Length of a job as whole years with a plus, e.g. "2+ years" (or plain
 * months, e.g. "8 months", while it is under a year). `start`/`end` are
 * "YYYY-MM"; a missing `end` means "until now". Both the first and the last
 * month are counted, so Dec 2023 → Oct 2026 is 2 years 11 months → "2+ years". */
export function formatDuration(
  start: string,
  end: string | undefined,
  locale: Locale,
): string {
  const now = new Date();
  const endIndex = end
    ? toMonthIndex(end)
    : now.getFullYear() * 12 + now.getMonth();
  const total = Math.max(1, endIndex - toMonthIndex(start) + 1);
  const years = Math.floor(total / 12);
  const months = total % 12;

  if (years > 0) return `${years}+ ${yearWord(years, locale)}`;
  return unit(months, UNITS[locale].month, locale);
}

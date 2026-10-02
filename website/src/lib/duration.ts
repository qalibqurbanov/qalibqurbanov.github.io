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

/** Length of a job as words, e.g. "2 years 11 months". `start`/`end` are
 * "YYYY-MM"; a missing `end` means "until now". Both the first and the last
 * month are counted, so Dec 2023 → Oct 2026 is 2 years 11 months. */
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
  const units = UNITS[locale];

  const parts: string[] = [];
  if (years > 0) parts.push(unit(years, units.year, locale));
  if (months > 0) parts.push(unit(months, units.month, locale));
  return parts.join(" ");
}

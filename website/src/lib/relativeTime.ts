const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 days ago" / "3 дня назад" / "3 gün əvvəl" for an ISO date, in the given BCP 47 locale. */
export function relativeTime(iso: string, bcp47: string): string {
  const seconds = (Date.parse(iso) - Date.now()) / 1000;
  const formatter = new Intl.RelativeTimeFormat(bcp47, { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(0, "second");
}

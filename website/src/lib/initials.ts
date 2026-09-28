/** First letter of each space-separated word in `name`, uppercased —
 * e.g. "Galib Gurbanov" -> "GG". Derived on demand instead of stored
 * alongside the name, so it can't drift out of sync when the name changes. */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

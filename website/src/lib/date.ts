export function formatDate(iso: string, bcp47: string): string {
  return new Date(iso).toLocaleDateString(bcp47, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

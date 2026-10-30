/** "auto" adds no colours of its own: each theme shows its own default colours. */
export const PALETTES = ["auto", "violet", "ocean", "forest", "sunset", "rose"] as const;

export type Palette = (typeof PALETTES)[number];

export const PALETTE_KEY = "palette";

/** The two colours of each swatch: the palette's dark-theme accent and second accent. */
export const PALETTE_SWATCHES: Record<Palette, readonly [string, string]> = {
  auto: ["#f472b6", "#22d3ee"],
  violet: ["#b185ff", "#d8b4fe"],
  ocean: ["#38bdf8", "#7dd3fc"],
  forest: ["#34d399", "#86efac"],
  sunset: ["#fb923c", "#fcd34d"],
  rose: ["#fb7185", "#f9a8d4"],
};

export function isPalette(value: unknown): value is Palette {
  return typeof value === "string" && (PALETTES as readonly string[]).includes(value);
}

export function getInitialPalette(): Palette {
  try {
    const stored = localStorage.getItem(PALETTE_KEY);
    if (isPalette(stored)) return stored;
  } catch {
    // Storage can be blocked; the default palette is fine.
  }
  return "auto";
}

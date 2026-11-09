/** "auto" adds no colours of its own: each theme shows its own default colours. */
export const PALETTES = ["auto", "violet", "ocean", "forest", "sunset", "rose", "crimson", "gold", "mint", "neon", "aurora", "fire", "candy", "cosmic", "lime", "arctic", "lavender", "copper", "graphite", "toxic", "tropic", "midnight"] as const;

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
  crimson: ["#ef4444", "#fb7185"],
  gold: ["#fbbf24", "#fde68a"],
  mint: ["#2dd4bf", "#a7f3d0"],
  neon: ["#22ff88", "#ff2bd6"],
  aurora: ["#34d399", "#a78bfa"],
  fire: ["#ef4444", "#facc15"],
  candy: ["#f472b6", "#67e8f9"],
  cosmic: ["#a78bfa", "#fb923c"],
  lime: ["#a3e635", "#facc15"],
  arctic: ["#bae6fd", "#c7d2fe"],
  lavender: ["#c4b5fd", "#f0abfc"],
  copper: ["#ea9a5a", "#f0b27a"],
  graphite: ["#e5e7eb", "#9ca3af"],
  toxic: ["#84cc16", "#22d3ee"],
  tropic: ["#fb923c", "#2dd4bf"],
  midnight: ["#6366f1", "#38bdf8"],
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

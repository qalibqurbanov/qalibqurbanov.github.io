/** "auto" adds no colours of its own: each theme shows its own default colours. */
export const PALETTES = ["auto", "aurora", "fire", "candy", "cosmic", "toxic", "tropic", "midnight", "sunset", "sunrise", "lagoon", "orchid", "citrus", "arctic", "lavender", "mint", "sakura", "peach", "sky", "pistachio", "lilac", "neon", "electric", "acid", "laser", "plasma", "forest", "copper", "terracotta", "sand", "olive", "moss", "gold", "emerald", "ruby", "sapphire", "amethyst", "sage", "dustyrose", "slate", "mauve", "violet", "ocean", "rose", "crimson", "lime", "tangerine", "cobalt", "fuchsia", "graphite", "ivory", "charcoal", "silver"] as const;

export type Palette = (typeof PALETTES)[number];

/** How the colour schemes are grouped in the settings menu. "auto" stands alone at the top. */
export const PALETTE_GROUPS = [
  { id: "gradient", palettes: ["aurora", "fire", "candy", "cosmic", "toxic", "tropic", "midnight", "sunset", "sunrise", "lagoon", "orchid", "citrus"] },
  { id: "pastel", palettes: ["arctic", "lavender", "mint", "sakura", "peach", "sky", "pistachio", "lilac"] },
  { id: "neon", palettes: ["neon", "electric", "acid", "laser", "plasma"] },
  { id: "earth", palettes: ["forest", "copper", "terracotta", "sand", "olive", "moss"] },
  { id: "jewel", palettes: ["gold", "emerald", "ruby", "sapphire", "amethyst"] },
  { id: "muted", palettes: ["sage", "dustyrose", "slate", "mauve"] },
  { id: "vibrant", palettes: ["violet", "ocean", "rose", "crimson", "lime", "tangerine", "cobalt", "fuchsia"] },
  { id: "neutral", palettes: ["graphite", "ivory", "charcoal", "silver"] },
] as const satisfies ReadonlyArray<{ id: string; palettes: readonly Palette[] }>;

export type PaletteGroup = (typeof PALETTE_GROUPS)[number]["id"];

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
  sunrise: ["#ff9a5a", "#ff5fa2"],
  lagoon: ["#2dd4bf", "#60a5fa"],
  orchid: ["#c084fc", "#f472b6"],
  citrus: ["#bef264", "#fb923c"],
  sakura: ["#f9a8d4", "#fbcfe8"],
  peach: ["#fdba9b", "#fde0c4"],
  sky: ["#a5d8ff", "#c7e5ff"],
  pistachio: ["#c3e6a1", "#dff3c8"],
  lilac: ["#d6bcfa", "#e9d8fd"],
  electric: ["#00e5ff", "#2979ff"],
  acid: ["#c6ff00", "#00e676"],
  laser: ["#ff2bd6", "#7c4dff"],
  plasma: ["#ff6d00", "#ff1744"],
  terracotta: ["#e07a5f", "#f2cc8f"],
  sand: ["#e6c79c", "#f1e0c5"],
  olive: ["#a3b565", "#d4d99a"],
  moss: ["#8fbf7f", "#c7e0a8"],
  emerald: ["#10c98f", "#00a676"],
  ruby: ["#f43f5e", "#ff7a93"],
  sapphire: ["#3b82f6", "#60a5fa"],
  amethyst: ["#a855f7", "#c084fc"],
  sage: ["#9db8a0", "#c4d6c6"],
  dustyrose: ["#d4a5ab", "#e8c9cd"],
  slate: ["#8fa3b8", "#b8c7d6"],
  mauve: ["#b69bb8", "#d6c3d8"],
  tangerine: ["#ff8c1a", "#ffb84d"],
  cobalt: ["#2f6bff", "#5b9bff"],
  fuchsia: ["#e040fb", "#ff5ccf"],
  ivory: ["#f2e8d5", "#d8cdb8"],
  charcoal: ["#d0d4da", "#9aa1ab"],
  silver: ["#e3e6ea", "#b6bbc3"],
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

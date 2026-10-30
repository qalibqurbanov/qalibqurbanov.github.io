import { cyber } from "./cyber";

/** Every style the site has. Each one lives in its own folder, next to `shared/`. */
export const STYLES = [cyber] as const;

export type StyleId = (typeof STYLES)[number]["id"];

export const STYLE_KEY = "style";

export const DEFAULT_STYLE: StyleId = cyber.id;

export function isStyleId(value: unknown): value is StyleId {
  return STYLES.some((style) => style.id === value);
}

export function getInitialStyle(): StyleId {
  try {
    const stored = localStorage.getItem(STYLE_KEY);
    if (isStyleId(stored)) return stored;
  } catch {
    // Storage can be blocked; the default style is fine.
  }
  return DEFAULT_STYLE;
}

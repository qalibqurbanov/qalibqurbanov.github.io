import { cyber } from "./cyber";
import { monochrome } from "./monochrome";
import { synthwave } from "./synthwave";
import { vaporwave } from "./vaporwave";
import { pixel } from "./pixel";
import { brutal } from "./brutal";

/** Every style the site has. Each one lives in its own folder, next to `shared/`. */
export const STYLES = [cyber, vaporwave, synthwave, monochrome, pixel, brutal] as const;

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

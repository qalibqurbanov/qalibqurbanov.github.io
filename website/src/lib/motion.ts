/** How much the page moves. "full" is every effect, "light" keeps fades and hover
 * changes but drops the heavy decoration (butterfly, fireflies, glitches, drifting
 * background), and "off" stops nearly all movement. The level lives on the root
 * element as `data-motion`, the same way the theme does, so the stylesheet and
 * plain scripts can read it without React. */
export type Motion = "full" | "light" | "off";

export const MOTION_LEVELS: readonly Motion[] = ["full", "light", "off"];

export const MOTION_KEY = "motion";

export function isMotion(value: unknown): value is Motion {
  return value === "full" || value === "light" || value === "off";
}

/** Whether the visitor's device asks for less movement. */
export function systemPrefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The level the visitor picked on an earlier visit, if any. */
export function getStoredMotion(): Motion | null {
  try {
    const stored = localStorage.getItem(MOTION_KEY);
    return isMotion(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** The saved choice, else what the device asks for: "light" if it wants less movement, otherwise "full". */
export function getInitialMotion(): Motion {
  return getStoredMotion() ?? (systemPrefersReducedMotion() ? "light" : "full");
}

/** The level the page is in right now. */
export function currentMotion(): Motion {
  const value = document.documentElement.getAttribute("data-motion");
  return isMotion(value) ? value : "full";
}

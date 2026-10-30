import { playIntro as chrome } from "../../chrome/intro";
import { playIntro as monochrome } from "../../monochrome/intro";
import { playIntro as synthwave } from "../../synthwave/intro";
import { playIntro as vaporwave } from "../../vaporwave/intro";
import type { IntroSpeed } from "./overlay";

const INTROS: Record<string, (speed: IntroSpeed) => void> = { vaporwave, synthwave, monochrome, chrome };

/** Plays the opening of a style that has its own. Returns false for the original style, whose
 * opening is the glitch flash. */
export function playThemeIntro(style: string | null | undefined, speed: IntroSpeed = 1): boolean {
  const play = style ? INTROS[style] : undefined;
  if (!play) return false;
  play(speed);
  return true;
}

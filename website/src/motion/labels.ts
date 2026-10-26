import { CirclePause, Feather, Sparkles, type LucideIcon } from "lucide-react";

import { useContent } from "@/i18n/context";
import type { Motion } from "@/lib/motion";

/** One icon per level: a spark for everything on, a feather for light, a pause for off. */
export const MOTION_ICONS: Record<Motion, LucideIcon> = { full: Sparkles, light: Feather, off: CirclePause };

/** The name of a motion level in the page's language. */
export function useMotionLabel(): (level: Motion) => string {
  const { ui } = useContent();
  return (level) => ({ full: ui.labels.motionFull, light: ui.labels.motionLight, off: ui.labels.motionOff })[level];
}

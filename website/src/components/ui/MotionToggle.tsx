import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";
import { useMotion } from "@/motion/context";
import { MOTION_ICONS, useMotionLabel } from "@/motion/labels";

/** A navbar button that steps through the animation levels: full, light, off. */
export function MotionToggle() {
  const { motion, cycleMotion } = useMotion();
  const { ui } = useContent();
  const label = format(ui.labels.motion, { level: useMotionLabel()(motion) });
  const Icon = MOTION_ICONS[motion];

  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 items-center justify-center text-muted hover:text-accent transition-colors md:h-auto md:w-auto"
      onClick={cycleMotion}
      aria-label={label}
      title={label}
    >
      <Icon size={19} />
    </button>
  );
}

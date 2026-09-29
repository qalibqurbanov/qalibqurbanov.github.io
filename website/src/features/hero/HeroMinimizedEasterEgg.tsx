import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";

interface HeroMinimizedEasterEggProps {
  visible: boolean;
  /** Seconds remaining until the parent auto-restores this — ticks down
   * live; the timer itself lives in the parent. */
  countdown: number;
}

/** Sits behind the hero window, invisible until the close button shrinks
 * the window away instead of actually closing it — kept fully transparent
 * (not just covered) the rest of the time so dragging the window doesn't
 * uncover it. No manual dismiss — it only goes away when the countdown
 * runs out. */
export function HeroMinimizedEasterEgg({ visible, countdown }: HeroMinimizedEasterEggProps) {
  const { ui, profile } = useContent();

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center rounded-xl border border-dashed border-border bg-surface/60 backdrop-blur-sm transition-opacity duration-500 ease-in-out ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="flex flex-col items-center gap-3 px-6 text-center font-mono">
        <span className="animate-float-slow select-none text-3xl">🕵️</span>
        <p className="text-sm text-text">{ui.hero.minimized.title}</p>
        <p className="text-xs text-muted">{format(ui.hero.minimized.joke, { name: profile.name })}</p>
        <p className="text-xs text-muted/70 tabular-nums">
          {format(ui.hero.minimized.restoreWarning, { seconds: String(countdown) })}
        </p>
      </div>
    </div>
  );
}

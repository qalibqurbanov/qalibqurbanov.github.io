import { RotateCcw } from "lucide-react";

import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";

interface HeroMinimizedEasterEggProps {
  visible: boolean;
  /** How many seconds until the caller auto-restores this — purely for
   * display; the actual timer lives in the parent. */
  restoreSeconds: number;
  onRestore: () => void;
}

/** Sits behind the hero window, invisible until the close button shrinks
 * the window away instead of actually closing it — kept fully transparent
 * (not just covered) the rest of the time so dragging the window doesn't
 * uncover it. */
export function HeroMinimizedEasterEgg({ visible, restoreSeconds, onRestore }: HeroMinimizedEasterEggProps) {
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
        <p className="text-xs text-muted/70">
          {format(ui.hero.minimized.restoreWarning, { seconds: String(restoreSeconds) })}
        </p>
        <button
          type="button"
          onClick={onRestore}
          tabIndex={visible ? 0 : -1}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-accent hover:text-accent"
        >
          <RotateCcw size={12} />
          {ui.hero.minimized.restore}
        </button>
      </div>
    </div>
  );
}

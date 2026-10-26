import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";
import type { Motion } from "@/lib/motion";
import { useMotion } from "@/motion/context";
import { MOTION_ICONS, useMotionLabel } from "@/motion/labels";

/** The stops of the slider, from the calmest page on the left to the fullest on the right. */
const STOPS: readonly Motion[] = ["off", "light", "full"];

/** How long the popup waits after the pointer leaves before it closes, so the pointer can cross the gap to it. */
const CLOSE_DELAY_MS = 220;

/** The navbar's animation control. A click steps through the levels (full, light, off) where a
 * pointer can hover; hovering or focusing it opens a small popup with a three-stop slider for
 * choosing the level directly. Where there is no hover (touch), a tap opens the popup instead. */
export function MotionToggle() {
  const { motion, setMotion, cycleMotion } = useMotion();
  const { ui } = useContent();
  const levelName = useMotionLabel();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef(0);

  const label = format(ui.labels.motion, { level: levelName(motion) });
  const Icon = MOTION_ICONS[motion];
  const stop = STOPS.indexOf(motion);
  const hints: Record<Motion, string> = {
    full: ui.labels.motionHintFull,
    light: ui.labels.motionHintLight,
    off: ui.labels.motionHintOff,
  };

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // A tap outside closes it (where there is no pointer leaving to do so).
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function show() {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function hideSoon() {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }

  function handleKeyDown(event: ReactKeyboardEvent) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      buttonRef.current?.focus();
    }
  }

  function handleClick() {
    if (window.matchMedia("(hover: hover)").matches) cycleMotion();
    else setOpen((value) => !value);
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={(event) => event.pointerType === "mouse" && show()}
      onPointerLeave={(event) => event.pointerType === "mouse" && hideSoon()}
      // Only keyboard focus opens it: a tap or click also focuses the button, and the tap handler decides then.
      onFocus={(event) => event.target.matches(":focus-visible") && show()}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center text-muted hover:text-accent transition-colors md:h-auto md:w-auto"
        onClick={handleClick}
        aria-label={label}
        aria-expanded={open}
        title={label}
      >
        <Icon size={19} />
      </button>

      {open ? (
        <div
          role="group"
          aria-label={ui.labels.motionTitle}
          className="absolute right-0 top-full z-50 w-60 pt-3 animate-popover-in"
          style={{ transformOrigin: "top right" }}
        >
          <div className="rounded-lg border border-border bg-surface p-4 shadow-lg">
            <p className="font-mono text-xs text-muted">{ui.labels.motionTitle}</p>
            <input
              type="range"
              min={0}
              max={STOPS.length - 1}
              step={1}
              value={stop}
              onChange={(event) => setMotion(STOPS[Number(event.target.value)])}
              aria-label={ui.labels.motionTitle}
              aria-valuetext={levelName(motion)}
              className="motion-range mt-3"
              style={{ "--fill": `${(stop / (STOPS.length - 1)) * 100}%` } as React.CSSProperties}
            />
            <div className="mt-1 flex justify-between font-mono text-xs">
              {STOPS.map((level) => (
                <button
                  key={level}
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMotion(level)}
                  className={`capitalize transition-colors hover:text-accent ${level === motion ? "text-accent" : "text-muted"}`}
                >
                  {levelName(level)}
                </button>
              ))}
            </div>
            <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted">{hints[motion]}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";
import type { Motion } from "@/lib/motion";
import { useMotion } from "@/motion/context";
import { MOTION_ICONS, useMotionLabel } from "@/motion/labels";

import { MotionSlider } from "./MotionSlider";

/** The stops of the slider, from the calmest page on the left to the fullest on the right. */
const STOPS: readonly Motion[] = ["off", "light", "full"];

/** How long the popup waits after the pointer has left before it closes. */
const CLOSE_DELAY_MS = 220;

const POPUP_WIDTH = 256;
const EDGE_GAP = 8;

interface Anchor {
  /** Distance from the window's right edge to the popup's right edge. */
  right: number;
  /** Distance from the popup's left edge to its arrow's tip. */
  arrow: number;
  top: number;
}

/** The navbar's animation control. A click steps through the levels (full, light, off) where a
 * pointer can hover; hovering or focusing it opens a small popup with a three-stop slider for
 * choosing the level directly. Where there is no hover (touch), a tap opens the popup instead.
 *
 * The popup is drawn on the page itself, not inside the navbar, and placed with fixed coordinates:
 * the page effects (signal loss, the storm, the demolition) tear, shake and move the navbar, and a
 * popup inside it would be dragged along. And it closes only from real pointer movement, never
 * from an element sliding out from under a pointer that has not moved. */
export function MotionToggle() {
  const { motion, setMotion, cycleMotion } = useMotion();
  const { ui } = useContent();
  const levelName = useMotionLabel();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef(0);

  const label = format(ui.labels.motion, { level: levelName(motion) });
  const Icon = MOTION_ICONS[motion];
  const hints: Record<Motion, string> = {
    full: ui.labels.motionHintFull,
    light: ui.labels.motionHintLight,
    off: ui.labels.motionHintOff,
  };

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Place the popup under the button, with its arrow on the middle of the button, kept inside the window.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const right = Math.max(0, Math.min(window.innerWidth - rect.right, window.innerWidth - EDGE_GAP - POPUP_WIDTH));
      const centre = rect.left + rect.width / 2;
      setAnchor({ right, arrow: POPUP_WIDTH - (window.innerWidth - centre - right), top: rect.bottom });
    }
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function inside(x: number, y: number) {
      return [buttonRef.current, popupRef.current].some((el) => {
        const rect = el?.getBoundingClientRect();
        return rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      });
    }
    function hideSoon() {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
    }
    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      if (inside(event.clientX, event.clientY)) window.clearTimeout(closeTimer.current);
      else hideSoon();
    }
    function handlePointerDown(event: PointerEvent) {
      if (!inside(event.clientX, event.clientY)) setOpen(false);
    }

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerdown", handlePointerDown);
    document.documentElement.addEventListener("mouseleave", hideSoon);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.documentElement.removeEventListener("mouseleave", hideSoon);
    };
  }, [open]);

  function show() {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
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
      className="inline-flex items-center"
      onPointerEnter={(event) => event.pointerType === "mouse" && show()}
      onKeyDown={handleKeyDown}
      // Only keyboard focus opens it: a tap or click also focuses the button, and the tap handler decides then.
      onFocus={(event) => event.target.matches(":focus-visible") && show()}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(next) && !popupRef.current?.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center text-muted hover:text-accent transition-colors md:h-auto md:w-auto"
        onClick={handleClick}
        aria-label={label}
        aria-expanded={open}
      >
        <Icon size={19} />
      </button>

      {open && anchor
        ? createPortal(
            <div
              ref={popupRef}
              role="group"
              aria-label={ui.labels.motionTitle}
              onKeyDown={handleKeyDown}
              onBlur={(event) => {
                const next = event.relatedTarget as Node | null;
                if (!event.currentTarget.contains(next) && !buttonRef.current?.contains(next)) setOpen(false);
              }}
              className="fixed z-[60] animate-popover-in pt-3"
              style={{ right: anchor.right, top: anchor.top, width: POPUP_WIDTH, transformOrigin: `${anchor.arrow}px 0` }}
            >
              {/* The same balloon as the site's other hints, with its arrow on the button. */}
              <div
                data-side="bottom"
                className="tip-balloon relative !pointer-events-auto !p-4"
                style={{ "--tip-arrow": `${anchor.arrow}px` } as React.CSSProperties}
              >
                <div className="flex items-baseline justify-between gap-3 font-mono text-xs">
                  <span className="uppercase tracking-wider text-muted">{ui.labels.motionTitle}</span>
                  <span className="capitalize text-accent">{levelName(motion)}</span>
                </div>
                <div className="mt-3">
                  <MotionSlider stops={STOPS} value={motion} onChange={setMotion} label={ui.labels.motionTitle} levelName={levelName} />
                </div>
                <p className="mt-3 border-t border-border pt-3 text-center text-xs leading-relaxed text-muted">{hints[motion]}</p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

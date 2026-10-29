import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { borderBurst } from "@/hooks/borderGlitch";
import { prefersReducedMotion } from "@/hooks/glitch";

import { CodeWindow } from "@/components/ui/CodeWindow";

/** How long the popup's glitch-out lasts before it is gone. */
const NOTICE_OUT_MS = 340;

/** How long a popup stays before it closes itself. */
export const NOTICE_MS = 8000;

/** A small window at the top right of the screen, in the site's own window style: what is
 * wrong with a form, why a send failed, how long to wait, or that something was done. It glitches in, and glitches
 * out when it is closed. A bar along its bottom edge runs down over `lifeMs` and the popup
 * closes itself when it is empty; the X in its title bar closes it sooner. */
export function Notice({
  tone,
  icon,
  onClose,
  lifeMs,
  from = 1,
  filename,
  children,
}: {
  tone: "danger" | "info" | "success";
  icon: ReactNode;
  onClose: () => void;
  lifeMs: number;
  from?: number;
  /** The title-bar name; each tone has a default. */
  filename?: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const leavingRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    closeRef.current = onClose;
  });

  const glitchBorder = useCallback((frames: number) => {
    const win = rootRef.current?.querySelector<HTMLElement>(".glitch-border");
    if (win) borderBurst(win, frames);
  }, []);

  const dismiss = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    glitchBorder(10);
    window.setTimeout(() => closeRef.current(), prefersReducedMotion() ? 0 : NOTICE_OUT_MS);
  }, [glitchBorder]);

  useEffect(() => {
    const glitchIn = window.setTimeout(() => glitchBorder(10), 80);
    const life = window.setTimeout(dismiss, lifeMs);
    return () => {
      window.clearTimeout(glitchIn);
      window.clearTimeout(life);
    };
  }, [lifeMs, dismiss, glitchBorder]);

  const danger = tone === "danger";
  return (
    <div
      ref={rootRef}
      role={danger ? "alert" : "status"}
      className={`${leaving ? "notice-out" : "notice-in"} fixed right-4 top-20 z-[70] w-[min(22rem,calc(100vw-2rem))]`}
    >
      <CodeWindow
        filename={filename ?? (danger ? "error.log" : tone === "success" ? "sent.log" : "wait.log")}
        onClose={dismiss}
        footer={
          <div className="h-0.5 w-full bg-surface-2" role="presentation">
            <div
              className={`notice-bar h-full origin-left ${danger ? "bg-danger" : tone === "success" ? "bg-gradient-to-r from-accent to-accent-2" : "bg-accent"}`}
              style={{ animationDuration: `${lifeMs}ms`, "--notice-from": from } as CSSProperties}
            />
          </div>
        }
      >
        <div className={`flex items-start gap-2.5 p-3 font-mono text-xs leading-relaxed ${danger ? "text-danger" : "text-text"}`}>
          <span className={`mt-px shrink-0 ${danger ? "" : tone === "success" ? "text-accent-2" : "text-accent"}`}>{icon}</span>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </CodeWindow>
    </div>
  );
}

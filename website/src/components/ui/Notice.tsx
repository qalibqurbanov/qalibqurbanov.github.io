import { X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useContent } from "@/i18n/context";
import { prefersReducedMotion } from "@/lib/motion";

/** How long the notice's fade-out lasts before it is gone. */
const NOTICE_OUT_MS = 340;

/** How long a notice stays before it closes itself. */
export const NOTICE_MS = 8000;

/** A small card at the top right of the screen: what is wrong with a form, why a send failed, how
 * long to wait, or that something was done. A bar along its bottom edge runs down over `lifeMs` and
 * the notice closes itself when it is empty; the X closes it sooner. */
export function Notice({
  tone,
  icon,
  onClose,
  lifeMs,
  from = 1,
  children,
}: {
  tone: "danger" | "info" | "success";
  icon: ReactNode;
  onClose: () => void;
  lifeMs: number;
  from?: number;
  children: ReactNode;
}) {
  const { ui } = useContent();
  const closeRef = useRef(onClose);
  const leavingRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    closeRef.current = onClose;
  });

  const dismiss = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    window.setTimeout(() => closeRef.current(), prefersReducedMotion() ? 0 : NOTICE_OUT_MS);
  }, []);

  useEffect(() => {
    const life = window.setTimeout(dismiss, lifeMs);
    return () => {
      window.clearTimeout(life);
    };
  }, [lifeMs, dismiss]);

  const danger = tone === "danger";
  return (
    <div
      role={danger ? "alert" : "status"}
      className={`${leaving ? "notice-out" : "notice-in"} fixed right-4 top-20 z-[70] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border bg-surface shadow-lg shadow-black/20 ${danger ? "border-danger/50" : "border-border"}`}
    >
      <div className={`flex items-start gap-3 p-4 text-sm leading-relaxed ${danger ? "text-danger" : "text-text"}`}>
        <span className={`mt-0.5 shrink-0 ${danger ? "" : "text-accent"}`}>{icon}</span>
        <div className="min-w-0 flex-1">{children}</div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={ui.labels.close}
          className="-mr-1 -mt-1 inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <X size={14} />
        </button>
      </div>
      <div className="h-0.5 w-full bg-surface-2" role="presentation">
        <div className={`notice-bar h-full origin-left ${danger ? "bg-danger" : "bg-accent"}`} style={{ animationDuration: `${lifeMs}ms`, "--notice-from": from } as CSSProperties} />
      </div>
    </div>
  );
}

import { X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useContent } from "@/i18n/context";
import { prefersReducedMotion } from "@/lib/motion";

/** How long the note's fade-out lasts before it is gone. */
const NOTE_OUT_MS = 200;

/** How long a note stays before it closes itself. */
export const NOTE_MS = 8000;

/** A compact one-line message under the Send button: no card, just a small coloured icon and a short text. It closes itself after
 * `lifeMs` (never, when that is left out); the small X closes it sooner. */
export function FormNote({
  tone,
  icon,
  onClose,
  lifeMs,
  children,
}: {
  tone: "danger" | "info" | "success";
  icon: ReactNode;
  onClose?: () => void;
  lifeMs?: number;
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
    window.setTimeout(() => closeRef.current?.(), prefersReducedMotion() ? 0 : NOTE_OUT_MS);
  }, []);

  useEffect(() => {
    if (lifeMs === undefined) return;
    const life = window.setTimeout(dismiss, lifeMs);
    return () => window.clearTimeout(life);
  }, [lifeMs, dismiss]);

  const tint = tone === "danger" ? "var(--color-danger)" : tone === "success" ? "var(--color-accent-2)" : "var(--color-accent)";
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`${leaving ? "notice-out" : "notice-in"} flex items-start gap-2 text-xs leading-relaxed text-muted`}
      style={{ "--tone": tint } as CSSProperties}
    >
      <span className="mt-[0.1875rem] shrink-0" style={{ color: "var(--tone)" }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={dismiss}
          aria-label={ui.labels.close}
          className="-mr-1 inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted/70 transition-colors hover:text-text"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

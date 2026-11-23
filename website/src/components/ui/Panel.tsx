import { X } from "lucide-react";
import type { ReactNode } from "react";

import { useContent } from "@/i18n/context";

interface PanelProps {
  /** The title of the panel. */
  title: string;
  /** Tabs shown in place of the plain title. */
  tabs?: ReactNode;
  /** A bar pinned under the content, outside whatever scrolls. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Shows a close button when given. */
  onClose?: () => void;
  /** The look of the left menu card: translucent glass with grain, soft drifting colour, and a comet of light round its rim. Used by the dialogs. */
  glass?: boolean;
  /** Glass only: a small drawn icon in front of the title, in one of the left card's two soft tones (blue for the CV, violet for the message). */
  icon?: ReactNode;
  tone?: "blue" | "violet";
  /** Glass only: a quiet line of detail under the title. */
  meta?: ReactNode;
  /** Glass only: buttons in the title row, before the close button. */
  actions?: ReactNode;
}

const CLOSE = "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-text";
const CLOSE_GLASS =
  "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-text)_14%,transparent)] text-muted transition-colors duration-300 hover:border-[color-mix(in_srgb,var(--color-accent)_55%,transparent)] hover:text-text";

/** A bordered panel with a title row (or tabs) and an optional close button. The frame of the
 * dialogs and of code samples. With `glass` it takes the look of the left menu card. */
export function Panel({ title, tabs, footer, children, className = "", onClose, glass = false, icon, tone = "blue", meta, actions }: PanelProps) {
  const { ui } = useContent();
  const close = onClose ? (
    <button type="button" onClick={onClose} aria-label={ui.labels.close} className={glass ? CLOSE_GLASS : CLOSE}>
      <X size={14} />
    </button>
  ) : null;

  const head = tabs ? (
    <div className={`flex shrink-0 items-center justify-between gap-2 pl-3.5 pr-2 py-1.5 ${glass ? "glass-head-line" : "border-b border-border"}`}>
      {glass && icon && <span className={`glass-chip draw-in ${tone === "violet" ? "tone-violet" : "tone-blue"} mr-0.5`}>{icon}</span>}
      <div className="flex min-w-0 flex-1 items-center gap-1" role="tablist">
        {tabs}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {close}
      </div>
    </div>
  ) : glass ? (
    <div className="glass-head-line flex shrink-0 items-center gap-2 py-1.5 pl-3.5 pr-2">
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-2 font-display text-[0.8125rem] font-semibold leading-tight tracking-tight text-text">
          {icon && <span className={`glass-chip draw-in ${tone === "violet" ? "tone-violet" : "tone-blue"}`}>{icon}</span>}
          <span className="truncate">{title}</span>
        </p>
        {meta && <p className={`truncate font-mono text-[0.5625rem] uppercase leading-tight tracking-[0.18em] text-muted ${icon ? "pl-[calc(14px+0.5rem)]" : ""}`}>{meta}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {close}
      </div>
    </div>
  ) : (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border py-2 pl-4 pr-2">
      <span className="text-sm font-medium text-muted">{title}</span>
      {close}
    </div>
  );

  return (
    <div className={glass ? `side-card glass-panel ${className}` : `overflow-hidden rounded-lg border border-border bg-surface ${className}`}>
      {glass && (
        <>
          <span className="card-mesh" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="card-rim" data-rim="comet" aria-hidden="true" />
          <span className="card-rim" data-rim="comet2" aria-hidden="true" />
        </>
      )}
      {head}
      {children}
      {footer}
      {glass && <span className="card-grain" aria-hidden="true" />}
    </div>
  );
}

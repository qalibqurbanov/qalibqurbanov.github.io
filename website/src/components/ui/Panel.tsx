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
}

/** A bordered panel with a title row (or tabs) and an optional close button. The frame of the
 * dialogs and of code samples. */
export function Panel({ title, tabs, footer, children, className = "", onClose }: PanelProps) {
  const { ui } = useContent();
  const close = onClose ? (
    <button
      type="button"
      onClick={onClose}
      aria-label={ui.labels.close}
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-text"
    >
      <X size={16} />
    </button>
  ) : null;

  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-surface ${className}`}>
      {tabs ? (
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-3 py-2">
          <div className="flex min-w-0 items-center gap-1" role="tablist">
            {tabs}
          </div>
          {close}
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border py-2 pl-4 pr-2">
          <span className="text-sm font-medium text-muted">{title}</span>
          {close}
        </div>
      )}
      {children}
      {footer}
    </div>
  );
}

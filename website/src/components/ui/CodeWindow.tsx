import type { ReactNode } from "react";

import { FileIcon } from "@/components/ui/FileIcon";
import { WindowControls } from "@/components/ui/WindowControls";

interface CodeWindowProps {
  filename: string;
  /** Editor tabs shown in place of the plain filename (see tabStyles). */
  tabs?: ReactNode;
  /** A bar pinned under the content, outside whatever scrolls. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Wires up the close button; when omitted, it renders visibly disabled
   * (see WindowControls). */
  onClose?: () => void;
}

/** A small "code editor" chrome — Windows-style title bar + a filename tab — wrapped around arbitrary content. */
export function CodeWindow({ filename, tabs, footer, children, className = "", onClose }: CodeWindowProps) {
  return (
    <div
      className={`glitch-border rounded-xl overflow-hidden border border-border bg-surface shadow-2xl shadow-black/40 ${className}`}
    >
      {tabs ? (
        <div className="shrink-0 flex items-stretch justify-between gap-4 pl-2 pr-1.5 bg-surface-2 border-b border-border">
          <div className="flex min-w-0 items-stretch -mb-px" role="tablist">
            {tabs}
          </div>
          <div className="flex items-center py-1.5">
            <WindowControls onClose={onClose} />
          </div>
        </div>
      ) : (
        <div className="shrink-0 flex items-center justify-between gap-4 pl-4 pr-1.5 py-1.5 bg-surface-2 border-b border-border">
          <span className="flex items-center gap-2 font-mono text-xs text-muted">
            <FileIcon />
            {filename}
          </span>
          <WindowControls onClose={onClose} />
        </div>
      )}
      {children}
      {footer}
    </div>
  );
}

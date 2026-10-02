import type { ReactNode } from "react";

import { FileIcon } from "@/components/ui/FileIcon";
import { WindowControls } from "@/components/ui/WindowControls";

interface CodeWindowProps {
  filename: string;
  children: ReactNode;
  className?: string;
  /** Wires up the close button; when omitted, it renders visibly disabled
   * (see WindowControls). */
  onClose?: () => void;
}

/** A small "code editor" chrome — Windows-style title bar + a filename tab — wrapped around arbitrary content. */
export function CodeWindow({ filename, children, className = "", onClose }: CodeWindowProps) {
  return (
    <div
      className={`glitch-border rounded-xl overflow-hidden border border-border bg-surface shadow-2xl shadow-black/40 ${className}`}
    >
      <div className="shrink-0 flex items-center justify-between gap-4 pl-4 pr-1.5 py-1.5 bg-surface-2 border-b border-border">
        <span className="flex items-center gap-2 font-mono text-xs text-muted">
          <FileIcon />
          {filename}
        </span>
        <WindowControls onClose={onClose} />
      </div>
      {children}
    </div>
  );
}

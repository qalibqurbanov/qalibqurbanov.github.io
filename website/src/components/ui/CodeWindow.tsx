import type { ReactNode } from "react";

interface CodeWindowProps {
  filename: string;
  children: ReactNode;
  className?: string;
}

/** A small "code editor" chrome — traffic lights + a filename tab — wrapped around arbitrary content. */
export function CodeWindow({ filename, children, className = "" }: CodeWindowProps) {
  return (
    <div
      className={`rounded-xl overflow-hidden border border-border bg-surface shadow-2xl shadow-black/40 ${className}`}
    >
      <div className="flex items-center gap-4 px-4 py-3 bg-surface-2 border-b border-border">
        <div className="window-dots flex items-center gap-1.5">
          <span />
          <span />
          <span />
        </div>
        <span className="font-mono text-xs text-muted">{filename}</span>
      </div>
      {children}
    </div>
  );
}

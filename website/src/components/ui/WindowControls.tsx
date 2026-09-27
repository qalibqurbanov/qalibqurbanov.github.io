import { Minus, Square, X } from "lucide-react";

/** Windows-style minimize/maximize/close button cluster for window chrome. */
export function WindowControls() {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      <span className="window-control">
        <Minus size={12} />
      </span>
      <span className="window-control">
        <Square size={10} />
      </span>
      <span className="window-control window-control-close">
        <X size={13} />
      </span>
    </div>
  );
}

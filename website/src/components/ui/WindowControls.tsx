import { Minus, Square, X } from "lucide-react";

interface WindowControlsProps {
  /** Wires up the minimize button; when omitted, it renders visibly disabled. */
  onMinimize?: () => void;
  /** Wires up the close button; when omitted, it renders visibly disabled. */
  onClose?: () => void;
}

/** Windows-style minimize/maximize/close button cluster for window chrome.
 * Maximize is always inert — a real window can't actually be maximized here.
 * Minimize/close are inert too unless wired up via props — either way, they're
 * styled to visibly look disabled rather than pretending to work. */
export function WindowControls({ onMinimize, onClose }: WindowControlsProps = {}) {
  return (
    <div className="flex items-center gap-0.5">
      {onMinimize ? (
        <button type="button" onClick={onMinimize} aria-label="Minimize" className="window-control">
          <Minus size={12} />
        </button>
      ) : (
        <span className="window-control window-control-disabled" aria-hidden="true">
          <Minus size={12} />
        </span>
      )}
      <span className="window-control window-control-disabled" aria-hidden="true">
        <Square size={10} />
      </span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="window-control window-control-close"
        >
          <X size={13} />
        </button>
      ) : (
        <span className="window-control window-control-close window-control-disabled" aria-hidden="true">
          <X size={13} />
        </span>
      )}
    </div>
  );
}

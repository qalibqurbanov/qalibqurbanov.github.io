import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";

import type { Motion } from "@/lib/motion";
import { MOTION_ICONS } from "@/motion/labels";

interface MotionSliderProps {
  /** The stops from left to right. */
  stops: readonly Motion[];
  value: Motion;
  onChange: (value: Motion) => void;
  /** Accessible name of the slider. */
  label: string;
  /** The name of a level in the page's language. */
  levelName: (level: Motion) => string;
}

/** A slider with one stop per motion level, each marked with its icon and name. The thumb glides
 * between stops: it follows the pointer while it is dragged and settles on the nearest stop when
 * it is let go. Keys: ←/↓ and →/↑ step, Home and End jump. */
export function MotionSlider({ stops, value, onChange, label, levelName }: MotionSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Where the thumb is while it is being dragged, as a share of the track (0–100); null otherwise.
  const [dragAt, setDragAt] = useState<number | null>(null);
  const last = stops.length - 1;
  const index = stops.indexOf(value);
  const at = dragAt ?? (index / last) * 100;

  function ratioOf(event: ReactPointerEvent) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  }

  function follow(event: ReactPointerEvent) {
    const ratio = ratioOf(event);
    setDragAt(ratio * 100);
    const next = stops[Math.round(ratio * last)];
    if (next !== value) onChange(next);
  }

  function handleKeyDown(event: ReactKeyboardEvent) {
    let target: number;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        target = index - 1;
        break;
      case "ArrowRight":
      case "ArrowUp":
        target = index + 1;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    target = Math.min(last, Math.max(0, target));
    if (target !== index) onChange(stops[target]);
  }

  return (
    <div className="mx-2 mt-3 select-none">
      <div className="relative h-12">
        {stops.map((level, position) => {
          const Icon = MOTION_ICONS[level];
          return (
            <button
              key={level}
              type="button"
              tabIndex={-1}
              onClick={() => onChange(level)}
              style={{ left: `${(position / last) * 100}%` }}
              className={`absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1 transition-colors hover:text-accent ${level === value ? "text-accent" : "text-muted"}`}
            >
              <Icon size={18} />
              <span className="font-mono text-xs capitalize">{levelName(level)}</span>
            </button>
          );
        })}
      </div>

      <div
        ref={trackRef}
        className="relative h-6 cursor-pointer touch-none"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          follow(event);
        }}
        onPointerMove={(event) => dragAt !== null && follow(event)}
        onPointerUp={() => setDragAt(null)}
        onPointerCancel={() => setDragAt(null)}
      >
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border" />
        <div
          data-dragging={dragAt !== null}
          className="motion-slider-move absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent"
          style={{ width: `${at}%` }}
        />
        {stops.map((level, position) => (
          <span
            key={level}
            aria-hidden="true"
            className={`absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${position <= index ? "bg-accent" : "bg-border"}`}
            style={{ left: `${(position / last) * 100}%` }}
          />
        ))}
        <div
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={last}
          aria-valuenow={index}
          aria-valuetext={levelName(value)}
          data-dragging={dragAt !== null}
          onKeyDown={handleKeyDown}
          className="motion-slider-move absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-accent outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          style={{ left: `${at}%`, boxShadow: "0 0 10px var(--glow-accent)" }}
        />
      </div>
    </div>
  );
}

import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useRef } from "react";

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

/** A slider with one stop per motion level. The slider is split into one column per stop, each with
 * its icon above the track and its name below, and the thumb can only rest on a stop: pressing or
 * dragging anywhere sends it gliding to the stop of the column the pointer is in. Keys: ←/↓ and
 * →/↑ step, Home and End jump. */
export function MotionSlider({ stops, value, onChange, label, levelName }: MotionSliderProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const pressed = useRef(false);
  const count = stops.length;
  const index = stops.indexOf(value);
  /** Where stop `position` sits along the strip, as a percentage: the middle of its column. */
  const at = (position: number) => ((position * 2 + 1) / (count * 2)) * 100;

  function choose(position: number) {
    const next = stops[position];
    if (next !== value) onChange(next);
  }

  function chooseAt(event: ReactPointerEvent) {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const column = Math.floor(((event.clientX - rect.left) / rect.width) * count);
    choose(Math.min(count - 1, Math.max(0, column)));
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
        target = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    choose(Math.min(count - 1, Math.max(0, target)));
  }

  return (
    <div className="select-none">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
        {stops.map((level) => {
          const Icon = MOTION_ICONS[level];
          return (
            <button
              key={level}
              type="button"
              tabIndex={-1}
              aria-label={levelName(level)}
              onClick={() => onChange(level)}
              className={`flex justify-center py-1 transition-colors hover:text-accent ${level === value ? "text-accent" : "text-muted"}`}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      <div
        ref={stripRef}
        className="relative h-7 cursor-pointer touch-none"
        onPointerDown={(event) => {
          pressed.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          chooseAt(event);
        }}
        onPointerMove={(event) => pressed.current && chooseAt(event)}
        onPointerUp={() => (pressed.current = false)}
        onPointerCancel={() => (pressed.current = false)}
      >
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-border" style={{ left: `${at(0)}%`, right: `${100 - at(count - 1)}%` }} />
        <div
          className="motion-slider-move absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: `${at(0)}%`, width: `${at(index) - at(0)}%` }}
        />
        {stops.map((level, position) => (
          <span
            key={level}
            aria-hidden="true"
            className={`absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${position <= index ? "bg-accent" : "bg-border"}`}
            style={{ left: `${at(position)}%` }}
          />
        ))}
        <div
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={count - 1}
          aria-valuenow={index}
          aria-valuetext={levelName(value)}
          onKeyDown={handleKeyDown}
          className="motion-slider-move absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-accent outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          style={{ left: `${at(index)}%`, boxShadow: "0 0 10px var(--glow-accent)" }}
        />
      </div>

      <div className="grid" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
        {stops.map((level) => (
          <button
            key={level}
            type="button"
            tabIndex={-1}
            onClick={() => onChange(level)}
            className={`pt-1 text-center font-mono text-xs capitalize transition-colors hover:text-accent ${level === value ? "text-accent" : "text-muted"}`}
          >
            {levelName(level)}
          </button>
        ))}
      </div>
    </div>
  );
}

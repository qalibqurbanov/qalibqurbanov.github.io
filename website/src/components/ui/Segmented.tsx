import type { CSSProperties, ReactNode } from "react";

interface SegmentedOption<T extends string> {
  id: T;
  label: ReactNode;
  /** Sets the `lang` of the button, for language names written in their own language. */
  lang?: string;
}

/** A small round switch for choosing one of a few options (the light/dark mode, the language). One lit pill sits behind the
 * chosen option and slides to the next one when the choice changes, softly, while the text colours fade (see `.seg-*` in
 * base.css). The pill is placed with a transform from the start, so nothing slides in when the switch first appears. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  const index = Math.max(0, options.findIndex((option) => option.id === value));
  return (
    <div role="group" aria-label={label} className="seg" style={{ "--n": options.length, "--i": index } as CSSProperties}>
      <span aria-hidden="true" className="seg-pill" />
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          lang={option.lang}
          aria-pressed={value === option.id}
          onClick={() => value !== option.id && onChange(option.id)}
          className="seg-btn"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

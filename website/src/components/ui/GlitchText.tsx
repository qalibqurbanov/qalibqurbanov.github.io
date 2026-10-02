import { useGlitchText } from "@/hooks/useGlitch";

interface GlitchTextProps {
  /** The visible text; it is also what the glitch ghosts are drawn from. */
  text: string;
  className?: string;
  /** Glitch once as it scrolls into view. */
  onEnter?: boolean;
  /** Glitch at random while it is on screen. */
  idle?: boolean;
}

/** Text that glitches (RGB-splits) while hovered — hovering the link or
 * button it sits in counts too — and optionally on scroll-in or at random. */
export function GlitchText({ text, className = "", onEnter, idle }: GlitchTextProps) {
  const ref = useGlitchText<HTMLSpanElement>({ onEnter, idle });

  return (
    <span ref={ref} data-text={text} className={`glitch-text ${className}`}>
      {text}
    </span>
  );
}

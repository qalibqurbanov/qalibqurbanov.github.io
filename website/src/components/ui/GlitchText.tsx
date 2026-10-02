import { useGlitchText } from "@/hooks/useGlitch";

interface GlitchTextProps {
  /** The visible text; it is also what the glitch ghosts are drawn from. */
  text: string;
  className?: string;
  /** Play an entrance as it scrolls into view. */
  onEnter?: boolean;
  /** Make that entrance a decode (noise settling into the text) rather than a split. */
  decode?: boolean;
  /** Glitch at random while it is on screen. */
  idle?: boolean;
}

/** Text that glitches (RGB-splits) while hovered — hovering the link, button
 * or `data-glitch-host` element it sits in counts too — and optionally on
 * scroll-in or at random. */
export function GlitchText({ text, className = "", onEnter, decode, idle }: GlitchTextProps) {
  const ref = useGlitchText<HTMLSpanElement>({ onEnter, decode, idle });

  return (
    <span ref={ref} data-text={text} className={`glitch-text ${className}`}>
      {text}
    </span>
  );
}

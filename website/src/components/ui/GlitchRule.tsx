import { useGlitchRule } from "@/hooks/useGlitch";

/** The horizontal rule that separates a section's heading (and its end) from
 * the content: a plain 1px line that glitches — segments slipping to another
 * row in the accent colours — as it scrolls in, now and then, and on hover. */
export function GlitchRule() {
  const ref = useGlitchRule<HTMLSpanElement>();

  return (
    <span ref={ref} className="glitch-rule" aria-hidden="true">
      <span className="glitch-rule-base" />
    </span>
  );
}

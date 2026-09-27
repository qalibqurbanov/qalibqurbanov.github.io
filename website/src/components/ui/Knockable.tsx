import type { ReactNode } from "react";

import { useKnockback } from "@/hooks/useKnockback";

interface KnockableProps {
  seed: number;
  className?: string;
  children: ReactNode;
}

/** Wraps an element so it gets knocked away when the draggable terminal
 * window is dragged over it, springing back once it's let go. Purely a
 * visual flourish — wrap the smallest element that reads as one "thing"
 * (a word, an icon), not a whole block of text. */
export function Knockable({ seed, className, children }: KnockableProps) {
  const { ref, style } = useKnockback<HTMLSpanElement>(seed);

  return (
    <span ref={ref} style={style} className={className ?? "inline-block"}>
      {children}
    </span>
  );
}

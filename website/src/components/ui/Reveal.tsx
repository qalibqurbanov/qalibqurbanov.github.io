import type { ComponentPropsWithoutRef } from "react";

import { useInView } from "@/hooks/useInView";

interface RevealProps extends ComponentPropsWithoutRef<"div"> {
  delayMs?: number;
  /** Hide again when it leaves the viewport, so it plays every time it scrolls back in. */
  replay?: boolean;
}

/** Fades and slides its children up into place the first time they scroll into view. */
export function Reveal({ delayMs = 0, replay = false, className = "", style, ...props }: RevealProps) {
  const { ref, isInView } = useInView<HTMLDivElement>(
    replay ? { triggerOnce: false, belowNavbar: true, threshold: 0.95 } : {},
  );

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
      style={{ transitionDelay: `${delayMs}ms`, ...style }}
      {...props}
    />
  );
}

import type { ComponentPropsWithoutRef } from "react";

import { useInView } from "@/hooks/useInView";

interface RevealProps extends ComponentPropsWithoutRef<"div"> {
  delayMs?: number;
}

/** Fades and slides its children up into place the first time they scroll into view. */
export function Reveal({ delayMs = 0, className = "", style, ...props }: RevealProps) {
  const { ref, isInView } = useInView<HTMLDivElement>();

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

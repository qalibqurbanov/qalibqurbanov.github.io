import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { useEffect, useRef } from "react";

interface RevealProps extends ComponentPropsWithoutRef<"div"> {
  delayMs?: number;
}

/** One observer for every Reveal on the page: it adds `is-visible` the first time an element
 * scrolls into view, then stops watching it. */
let observer: IntersectionObserver | null = null;
function watch(el: Element) {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  observer.observe(el);
}

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({ delayMs = 0, className = "", style, children, ...props }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) watch(el);
    return () => {
      if (el) observer?.unobserve(el);
    };
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} style={{ "--reveal-delay": `${delayMs}ms`, ...style } as CSSProperties} {...props}>
      {children}
    </div>
  );
}

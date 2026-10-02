import { useEffect, useRef, useState } from "react";

import { belowNavbarMargin } from "@/lib/viewport";

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  /** Once true, keep it true even if the element leaves the viewport again. */
  triggerOnce?: boolean;
  /** Treat the area under the fixed navbar as outside the screen. */
  belowNavbar?: boolean;
}

export function useInView<T extends HTMLElement>({
  threshold = 0.15,
  rootMargin = "0px",
  triggerOnce = true,
  belowNavbar = false,
}: UseInViewOptions = {}) {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // `isIntersecting` stays true while any sliver overlaps, so a replaying
        // element goes by the visible ratio to reset as it slides under the navbar.
        const visible = triggerOnce ? entry.isIntersecting : entry.intersectionRatio >= threshold - 0.01;
        if (visible) {
          setIsInView(true);
          if (triggerOnce) observer.unobserve(node);
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin: belowNavbar ? belowNavbarMargin() : rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, belowNavbar]);

  return { ref, isInView };
}

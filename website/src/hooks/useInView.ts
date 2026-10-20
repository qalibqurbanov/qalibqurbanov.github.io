import { useEffect, useRef, useState } from "react";

import { belowNavbarMargin } from "@/lib/viewport";

/** How far below the show ratio a replaying element has to drop before it hides again. */
const REPLAY_HYSTERESIS = 0.3;

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
        if (triggerOnce) {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(node);
          }
          return;
        }
        // Hide and show at different ratios: the hidden state is shifted down,
        // which by itself moves the element back over the show threshold, so a
        // single threshold made it flicker at one exact scroll position.
        if (entry.intersectionRatio >= threshold - 0.01) setIsInView(true);
        else if (entry.intersectionRatio < threshold - REPLAY_HYSTERESIS) setIsInView(false);
      },
      {
        threshold: triggerOnce ? threshold : [0, threshold - REPLAY_HYSTERESIS, threshold - 0.01, threshold, 1],
        rootMargin: belowNavbar ? belowNavbarMargin() : rootMargin,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, belowNavbar]);

  return { ref, isInView };
}

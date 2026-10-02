import { useEffect, useRef } from "react";

const MAX_SHIFT = 18;

/** Drifts an element vertically in proportion to how far it is from the
 * middle of the viewport, as `--py` (read by `.parallax-card`). Give
 * neighbouring elements opposite `depth` signs and they slide past each
 * other while scrolling. Skipped under reduced motion. */
export function useCardParallax<T extends HTMLElement>(depth: number) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let shift = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      // Measure from where the card rests, not where the shift has put it.
      const center = rect.top + rect.height / 2 - shift - window.innerHeight / 2;
      shift = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, center * depth));
      el.style.setProperty("--py", `${shift.toFixed(1)}px`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [depth]);

  return ref;
}

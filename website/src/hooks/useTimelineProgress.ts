import { useEffect, useRef } from "react";

/** Makes a vertical timeline draw itself as the page scrolls: publishes how
 * far down the list the viewport has reached as `--tl` (0–1) and marks each
 * `[data-dot]` inside it with `data-reached` once it has been passed. Written
 * straight to the DOM, rAF throttled. Under reduced motion everything is
 * shown as already drawn. */
export function useTimelineProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dots = Array.from(el.querySelectorAll<HTMLElement>("[data-dot]"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--tl", "1");
      dots.forEach((dot) => dot.setAttribute("data-reached", ""));
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const anchor = window.innerHeight * 0.6;
      const rect = el.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (anchor - rect.top) / rect.height));
      el.style.setProperty("--tl", progress.toFixed(3));
      dots.forEach((dot) => {
        const reached = dot.getBoundingClientRect().top < anchor;
        if (reached) dot.setAttribute("data-reached", "");
        else dot.removeAttribute("data-reached");
      });
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
  }, []);

  return ref;
}

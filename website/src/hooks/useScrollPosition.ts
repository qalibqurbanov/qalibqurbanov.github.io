import { useEffect, useState, type RefObject } from "react";

/** Returns true once the page has scrolled past `threshold` pixels. */
export function useScrolledPast(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

/** Keeps the width of the referenced bar at how far down the page the user has scrolled (0-100%).
 * It writes the style directly, so a fast scroll does not re-render the component every frame. */
export function useScrollProgress<T extends HTMLElement>(ref: RefObject<T | null>): void {
  useEffect(() => {
    let ticking = false;
    let last = -1;
    const apply = () => {
      ticking = false;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0;
      if (Math.abs(progress - last) < 0.1) return;
      last = progress;
      if (ref.current) ref.current.style.width = `${progress}%`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);
}

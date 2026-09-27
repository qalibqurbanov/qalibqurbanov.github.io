import { useEffect, useState } from "react";

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

/** Returns how far down the page the user has scrolled, as a 0-100 percentage. */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return progress;
}

/**
 * Publishes the page's scroll offset as the `--scroll-y` CSS custom property
 * on <html>, rAF-throttled and written directly to the DOM (no React state,
 * no re-render). Any element anywhere — now or added later — can react to
 * scroll purely in CSS by reading `var(--scroll-y)`; the `.parallax-layer`
 * utility in index.css is the standard way to consume it. Skips updates
 * under prefers-reduced-motion so parallax never fights that preference.
 */
export function useScrollParallax(): void {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.setProperty("--scroll-y", "0");
      return;
    }

    let ticking = false;
    const apply = () => {
      root.style.setProperty("--scroll-y", String(window.scrollY));
      ticking = false;
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
  }, []);
}

/**
 * Toggles an `is-scrolling` class on <html> while the page is actively
 * scrolling, so the scrollbar's pseudo-elements can animate in CSS without
 * a React re-render on every scroll frame.
 */
export function useScrollbarActivity(idleMs = 300): void {
  useEffect(() => {
    const root = document.documentElement;
    let timeout: number | undefined;

    const onScroll = () => {
      root.classList.add("is-scrolling");
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => root.classList.remove("is-scrolling"), idleMs);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timeout);
      root.classList.remove("is-scrolling");
    };
  }, [idleMs]);
}

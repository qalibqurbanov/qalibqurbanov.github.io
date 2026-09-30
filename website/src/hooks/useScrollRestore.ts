import { useLayoutEffect, useRef } from "react";

/**
 * Remembers where the main page was scrolled to while a full-page view
 * (project case study, resume) replaces it, and puts the visitor back there
 * when it closes. The main page unmounts while a view is open, so the browser
 * can't keep the position itself.
 *
 * Layout effects are used on purpose: the cleanup must detach the scroll
 * listener synchronously at commit, before the swap collapses the document
 * height and the browser fires a scroll event that would overwrite the saved
 * position with 0.
 */
export function useScrollRestore(viewOpen: boolean): void {
  const savedY = useRef(0);
  const wasOpen = useRef(viewOpen);

  useLayoutEffect(() => {
    if (viewOpen) return;
    function handleScroll() {
      savedY.current = window.scrollY;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [viewOpen]);

  useLayoutEffect(() => {
    if (wasOpen.current && !viewOpen) {
      // `instant` bypasses the page-wide `scroll-behavior: smooth`, so the
      // visitor lands in place instead of watching a scroll from the top.
      window.scrollTo({ top: savedY.current, behavior: "instant" });
    }
    wasOpen.current = viewOpen;
  }, [viewOpen]);
}

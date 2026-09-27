import { useEffect } from "react";

/** Walks up from a wheel event's target looking for a genuinely scrollable
 * ancestor (the hero terminal, the command palette list) short of the
 * document itself, so those keep native wheel scrolling untouched. */
function findScrollableAncestor(node: EventTarget | null): Element | null {
  let el = node instanceof Element ? node : null;
  while (el && el !== document.documentElement && el !== document.body) {
    const overflowY = getComputedStyle(el).overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

/**
 * Replaces the browser's native step-by-step wheel scroll with an eased
 * lerp toward the target offset, so the page glides instead of jumping in
 * discrete ticks. Off entirely on touch/coarse pointers (native touch
 * momentum is already smooth) and under prefers-reduced-motion, and it backs
 * off whenever the wheel event belongs to an inner scrollable panel or a
 * Radix popover has locked page scroll, so it never fights either.
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (prefersReduced || isCoarsePointer) return;

    let target = window.scrollY;
    let current = window.scrollY;
    let rafId: number | null = null;

    const maxScroll = () => Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

    const step = () => {
      current += (target - current) * 0.35;
      if (Math.abs(target - current) < 0.5) {
        current = target;
        window.scrollTo(0, current);
        rafId = null;
        return;
      }
      window.scrollTo(0, current);
      rafId = requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (document.body.hasAttribute("data-scroll-locked")) return;
      if (findScrollableAncestor(event.target)) return;

      event.preventDefault();
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      target = Math.min(Math.max(target + delta, 0), maxScroll());
      if (rafId === null) {
        current = window.scrollY;
        rafId = requestAnimationFrame(step);
      }
    };

    // Keeps target/current in sync with scroll that didn't come from our own
    // lerp — keyboard paging, anchor links, browser back/forward restore.
    const onNativeScroll = () => {
      if (rafId === null) {
        target = window.scrollY;
        current = window.scrollY;
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onNativeScroll, { passive: true });
    window.addEventListener("resize", onNativeScroll);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onNativeScroll);
      window.removeEventListener("resize", onNativeScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);
}

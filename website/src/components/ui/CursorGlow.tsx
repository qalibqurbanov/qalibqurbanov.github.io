import { useEffect, useRef } from "react";

/** A soft accent glow that follows the cursor behind the page, with the
 * background grid lighting up around it. Mouse-like pointers only; the
 * position goes straight to CSS custom properties (no React state), rAF
 * throttled. */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      el.style.setProperty("--cx", `${x}px`);
      el.style.setProperty("--cy", `${y}px`);
      frame = 0;
    };
    const handleMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      el.classList.add("is-active");
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const handleLeave = () => el.classList.remove("is-active");

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handleLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handleMove);
      document.documentElement.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}

import { useEffect, useMemo, useRef } from "react";
import { prefersReducedMotion } from "@/hooks/glitch";
import { createCodeReveal } from "@/lib/codeReveal";
import { isNotFoundPage } from "@/lib/notFound";

/** A soft accent glow that follows the cursor behind the page, with the
 * background grid lighting up around it. Mouse-like pointers only; the
 * position goes straight to CSS custom properties (no React state), rAF
 * throttled. On the 404 page the light also uncovers source code that sits fixed in the
 * background (see lib/codeReveal.ts): the same circle masks it, and a burst of signal loss
 * is what changes the code. */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const notFound = useMemo(() => isNotFoundPage(), []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (prefersReducedMotion()) return;

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

    // The code changes with every burst of signal loss (lib/effects.ts).
    const reveal = codeRef.current ? createCodeReveal(codeRef.current) : null;
    if (reveal) document.addEventListener("signalburst", reveal.burst);

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handleLeave);
    return () => {
      cancelAnimationFrame(frame);
      if (reveal) {
        document.removeEventListener("signalburst", reveal.burst);
        reveal.destroy();
      }
      window.removeEventListener("pointermove", handleMove);
      document.documentElement.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <div ref={ref} className="cursor-glow" aria-hidden="true">
      {notFound ? <div ref={codeRef} className="cursor-glow-code" /> : null}
    </div>
  );
}

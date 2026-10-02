/** Magnetic buttons: while the pointer is over a `.btn-pulse` button it leans
 * toward the cursor, then eases back when the pointer leaves. Uses the
 * `translate` property (not `transform`) so it never fights the button's
 * other transforms, and event delegation so every button behaves the same
 * with no per-component wiring. Fine pointers only. */

const PULL = 0.28;
const MAX_X = 9;
const MAX_Y = 6;

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

export function installMagnetic(): void {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let current: HTMLElement | null = null;
  let shiftX = 0;
  let shiftY = 0;

  const release = () => {
    if (current) current.style.translate = "";
    current = null;
    shiftX = 0;
    shiftY = 0;
  };

  document.addEventListener(
    "pointermove",
    (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(".btn-pulse") : null;
      if (target !== current) {
        release();
        current = target;
      }
      if (!current) return;
      // The button's box already includes its current shift, so take that out
      // to measure from where it rests — otherwise it chases its own centre.
      const rect = current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - shiftX;
      const centerY = rect.top + rect.height / 2 - shiftY;
      shiftX = clamp((event.clientX - centerX) * PULL, MAX_X);
      shiftY = clamp((event.clientY - centerY) * PULL, MAX_Y);
      current.style.translate = `${shiftX.toFixed(1)}px ${shiftY.toFixed(1)}px`;
    },
    { passive: true },
  );
  document.documentElement.addEventListener("pointerleave", release);
}

/** Pointer position over a card, as CSS variables the themes use for their own hover effects: --mx and --my
 * in px inside the card, --dx and --dy from -1 to 1 away from its centre. The original style has its own
 * hover (the border glitch) and is left alone. */
export function installThemeHover(): void {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  let current: HTMLElement | null = null;
  const clear = () => {
    current?.style.removeProperty("--mx");
    current?.style.removeProperty("--my");
    current?.style.removeProperty("--dx");
    current?.style.removeProperty("--dy");
    current = null;
  };
  document.addEventListener(
    "pointermove",
    (event) => {
      if (document.documentElement.getAttribute("data-style") === "cyber") return;
      const card = event.target instanceof Element ? event.target.closest<HTMLElement>(".card-surface") : null;
      if (card !== current) {
        clear();
        current = card;
      }
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = event.clientX - r.left;
      const y = event.clientY - r.top;
      card.style.setProperty("--mx", `${x.toFixed(0)}px`);
      card.style.setProperty("--my", `${y.toFixed(0)}px`);
      card.style.setProperty("--dx", ((x / r.width) * 2 - 1).toFixed(2));
      card.style.setProperty("--dy", ((y / r.height) * 2 - 1).toFixed(2));
    },
    { passive: true },
  );
  document.documentElement.addEventListener("pointerleave", clear);
}

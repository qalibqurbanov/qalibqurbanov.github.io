/** Shared plumbing for the themes' opening animations: a full-screen layer that covers the page,
 * plays, and removes itself. */

/** Time scale: 1 is the full opening, less is the short version used for quick transitions. */
export type IntroSpeed = number;

export function el(tag: string, className: string, style: Record<string, string> = {}): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  for (const [key, value] of Object.entries(style)) node.style.setProperty(key, value);
  return node;
}

/** Puts an opening on the page. `total` is its length in ms at full speed; `build` fills the layer.
 * Only one opening exists at a time, and none plays when the visitor asked for less movement. */
export function mountIntro(id: string, total: number, speed: IntroSpeed, build: (root: HTMLElement) => void): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (document.documentElement.getAttribute("data-motion") === "off") return;
  document.querySelectorAll(".theme-intro").forEach((node) => node.remove());
  const root = el("div", `theme-intro ti-${id}`, { "--k": String(speed) });
  root.setAttribute("aria-hidden", "true");
  build(root);
  document.body.appendChild(root);
  window.setTimeout(() => root.remove(), total * speed + 200);
}

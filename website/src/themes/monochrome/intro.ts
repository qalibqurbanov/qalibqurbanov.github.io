import { el, mountIntro, type IntroSpeed } from "../shared/intro/overlay";

/** Two plain panels and a number counting to a hundred, then the panels part, sharply. */
export function playIntro(speed: IntroSpeed = 1): void {
  mountIntro("monochrome", 1700, speed, (root) => {
    const count = el("div", "tm-count");
    count.textContent = "0";
    root.append(el("div", "tm-panel tm-left"), el("div", "tm-panel tm-right"), el("div", "tm-rule"), count);
    const start = performance.now();
    const length = 1000 * speed;
    const tick = () => {
      if (!count.isConnected) return;
      const k = Math.min(1, (performance.now() - start) / length);
      count.textContent = String(Math.round(100 * (1 - (1 - k) ** 2)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

import { el, mountIntro, type IntroSpeed } from "../shared/intro/overlay";

/** A sheet of liquid metal covers the screen; a drop lands in the middle and the surface opens
 * outward from it in a bright ring, revealing the page. */
export function playIntro(speed: IntroSpeed = 1): void {
  mountIntro("chrome", 1700, speed, (root) => {
    root.append(el("div", "tr-sheet"), el("div", "tr-ring"), el("div", "tr-ring tr-ring-2"), el("div", "tr-drop"));
  });
}

import { el, mountIntro, type IntroSpeed } from "../shared/intro/overlay";

/** A neon line draws across a black screen, flickers, and splits open to the sunset. */
export function playIntro(speed: IntroSpeed = 1): void {
  mountIntro("synthwave", 1700, speed, (root) => {
    root.append(el("div", "tw-half tw-top"), el("div", "tw-half tw-bot"), el("div", "tw-line"), el("div", "tw-glow"));
  });
}

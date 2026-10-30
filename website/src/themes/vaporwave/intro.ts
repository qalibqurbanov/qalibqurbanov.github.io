import { el, mountIntro, type IntroSpeed } from "../shared/intro/overlay";

const STRIPS = 10;

/** An old computer starting up: a pastel desktop with a window and a loading bar that fills in
 * blocks, then the desktop opens like venetian blinds. */
export function playIntro(speed: IntroSpeed = 1): void {
  mountIntro("vaporwave", 1900, speed, (root) => {
    for (let i = 0; i < STRIPS; i++) {
      root.append(el("div", "tv-strip", { "--i": String(i), "--dir": i % 2 ? "1" : "-1" }));
    }
    const win = el("div", "tv-win");
    const bar = el("div", "tv-bar");
    bar.textContent = "▓▒░ ＶＡＰＯＲ.EXE";
    const track = el("div", "tv-track");
    track.append(el("div", "tv-fill"));
    win.append(bar, track);
    root.append(win);
  });
}

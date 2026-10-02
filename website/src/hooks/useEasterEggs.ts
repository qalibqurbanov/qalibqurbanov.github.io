import { useEffect } from "react";

import { glitchStorm, showToast } from "@/lib/effects";

const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];

/** Listens for the Konami code anywhere on the page; entering it sets off a
 * glitch storm and shows `message`. */
export function useEasterEggs(message: string): void {
  useEffect(() => {
    let progress = 0;
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;

      const key = event.key.toLowerCase();
      if (key === KONAMI[progress]) {
        progress += 1;
        if (progress === KONAMI.length) {
          progress = 0;
          showToast(message);
          glitchStorm();
        }
      } else {
        progress = key === KONAMI[0] ? 1 : 0;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [message]);
}

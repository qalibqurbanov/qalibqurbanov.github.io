import { useCallback, useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/lib/motion";

/** The characters a word is "decoded" from: digits and the brackets of code. */
const GLYPHS = "01<>/{}[]#$%*+=";
const STEP_MS = 45;

function scrambled(text: string, revealed: number): string {
  return [...text].map((char, index) => (index < revealed || char === " " ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join("");
}

/** Text that decodes into itself: every letter starts as a random code character and the real ones
 * settle in from left to right. It plays once when it appears (after `delay`) and again whenever the
 * pointer comes over it. Screen readers get the plain text from the parent's label, so mark the parent
 * with `aria-label`, and give this a `key` that follows the text so a new text starts afresh. */
export function ScrambleText({ text, delay = 0, duration = 900, playOnMount = true }: { text: string; delay?: number; duration?: number; playOnMount?: boolean }) {
  const reduced = prefersReducedMotion();
  const [shown, setShown] = useState(() => (playOnMount && !reduced ? scrambled(text, 0) : text));
  const timers = useRef<{ start: number; tick: number }>({ start: 0, tick: 0 });

  const play = useCallback(() => {
    if (reduced) return;
    window.clearTimeout(timers.current.start);
    window.clearInterval(timers.current.tick);
    const begin = performance.now();
    timers.current.tick = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - begin) / duration);
      if (progress >= 1) {
        window.clearInterval(timers.current.tick);
        setShown(text);
        return;
      }
      setShown(scrambled(text, Math.floor(progress * text.length)));
    }, STEP_MS);
  }, [text, duration, reduced]);

  useEffect(() => {
    if (!playOnMount || reduced) return;
    timers.current.start = window.setTimeout(play, delay);
    const current = timers.current;
    return () => {
      window.clearTimeout(current.start);
      window.clearInterval(current.tick);
    };
  }, [text, delay, playOnMount, reduced, play]);

  return (
    <span aria-hidden="true" onPointerEnter={play} className="cursor-default">
      {shown}
    </span>
  );
}

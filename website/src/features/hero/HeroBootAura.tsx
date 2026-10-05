import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import { borderGlitchLoop } from "@/hooks/borderGlitch";

interface HeroBootAuraProps {
  /** True while the window is still booting; the frame fades out once it is false. */
  active: boolean;
}

/** How long the frame takes to fade out when the boot is over. */
const FADE_MS = 700;

/** The four corner brackets: which corner, which way they fly in from, which accent they use. */
const BRACKETS = [
  { corner: "left-0 top-0 border-l-2 border-t-2 rounded-tl-lg", from: [-1, -1], color: "--color-accent", delay: 0 },
  { corner: "right-0 top-0 border-r-2 border-t-2 rounded-tr-lg", from: [1, -1], color: "--color-accent-2", delay: 140 },
  { corner: "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg", from: [1, 1], color: "--color-accent", delay: 280 },
  { corner: "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg", from: [-1, 1], color: "--color-accent-2", delay: 420 },
] as const;

/** Sonar rings sent out from the window's edge, one after another, in alternating accents. */
const RIPPLES = [
  { color: "--color-accent", delay: 0 },
  { color: "--color-accent-2", delay: 1100 },
  { color: "--color-accent", delay: 2200 },
] as const;

/** What surrounds the hero window while it boots, like a targeting frame
 * locking on: four corner brackets fly in and snap to it, soft rings ripple
 * out from its edge like a sonar ping, and its border breaks into flickering
 * fragments (the site's border glitch, running on its own). When the boot
 * finishes the frame dissolves and one last ring bursts outward. Mount it
 * behind the window, in the same relatively positioned frame. */
export function HeroBootAura({ active }: HeroBootAuraProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [finished, setFinished] = useState(false);

  // Mounting with opacity 0 and switching it a frame later is what lets the fade-in transition run.
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // The closing burst only plays for a boot that actually ran (not when it was skipped from the start).
  const wasActive = useRef(active);
  useEffect(() => {
    if (wasActive.current && !active) setFinished(true);
    wasActive.current = wasActive.current || active;
  }, [active]);

  useEffect(() => {
    const ring = ringRef.current;
    if (!active || !ring) return;
    return borderGlitchLoop(ring);
  }, [active]);

  return (
    <>
      <div
        aria-hidden="true"
        style={{ transitionDuration: `${FADE_MS}ms` }}
        className={`pointer-events-none absolute -inset-3 transition-opacity ease-in-out ${
          shown && active ? "opacity-100" : "opacity-0"
        }`}
      >
        {RIPPLES.map((ripple) => (
          <i
            key={ripple.delay}
            style={{ "--hud-color": `var(${ripple.color})`, "--hud-delay": `${ripple.delay}ms` } as CSSProperties}
            className="hud-ripple"
          />
        ))}
        <div ref={ringRef} className="glitch-border h-full w-full rounded-3xl" />
        {BRACKETS.map((bracket) => (
          <i
            key={bracket.corner}
            style={
              {
                "--hud-delay": `${bracket.delay}ms`,
                "--hx": bracket.from[0],
                "--hy": bracket.from[1],
                borderColor: `var(${bracket.color})`,
                color: `var(${bracket.color})`,
              } as CSSProperties
            }
            className={`hud-bracket ${bracket.corner}`}
          />
        ))}
      </div>
      {finished && <i aria-hidden="true" className="hud-burst pointer-events-none absolute inset-0 rounded-xl" />}
    </>
  );
}

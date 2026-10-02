import { useMemo, type CSSProperties } from "react";

import { useScrollParallax } from "@/hooks/useScrollPosition";
import { useThemeValue } from "@/theme/context";

const STAR_COUNT = 34;

interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacityMin: number;
  opacityMax: number;
  scaleMin: number;
  scaleMax: number;
  dx: number;
  dy: number;
}

/** Each star gets its own randomized size, drift path, timing, and brightness
 * range, so the field never settles into a shared, synchronized pattern — a
 * fraction of them are given a wide opacity/scale swing to read as visibly
 * "breathing" while the rest just twinkle faintly. */
function generateStars(count: number): Star[] {
  return Array.from({ length: count }, (_, id) => {
    const breathes = Math.random() < 0.25;
    return {
      id,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: breathes ? 1.8 + Math.random() * 1.4 : 1 + Math.random() * 1.2,
      duration: 3.5 + Math.random() * 7,
      delay: -Math.random() * 10,
      opacityMin: breathes ? 0.08 + Math.random() * 0.1 : 0.15 + Math.random() * 0.15,
      opacityMax: breathes ? 0.85 + Math.random() * 0.15 : 0.4 + Math.random() * 0.3,
      scaleMin: breathes ? 0.6 + Math.random() * 0.2 : 0.9 + Math.random() * 0.1,
      scaleMax: breathes ? 1.3 + Math.random() * 0.5 : 1 + Math.random() * 0.15,
      dx: (Math.random() - 0.5) * 32,
      dy: (Math.random() - 0.5) * 32,
    };
  });
}

/** Fixed, blurred glow blobs drifting slowly behind the whole page — the
 * ambient motion that keeps the site feeling alive between sections. Dark
 * theme also gets a faint field of individually-animated stars, since stars
 * only read as "night" once the background actually goes dark.
 *
 * Every piece sits in its own `.parallax-layer` wrapper with a `--depth`, so
 * the whole background shifts with scroll instead of sitting frozen behind
 * the page — and anything added here later just needs the same wrapper to
 * join in, no extra scroll wiring required. */
export function AmbientBackground() {
  const theme = useThemeValue();
  const stars = useMemo(() => generateStars(STAR_COUNT), []);
  useScrollParallax();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {theme === "dark" && (
        <div
          className="parallax-layer absolute inset-0"
          style={{ "--depth": -0.08 } as CSSProperties}
        >
          {stars.map((star) => (
            <span
              key={star.id}
              className="star-dot"
              style={
                {
                  top: `${star.top}%`,
                  left: `${star.left}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  animationDuration: `${star.duration}s`,
                  animationDelay: `${star.delay}s`,
                  "--op-a": star.opacityMin,
                  "--op-b": star.opacityMax,
                  "--scale-a": star.scaleMin,
                  "--scale-b": star.scaleMax,
                  "--dx": `${star.dx}px`,
                  "--dy": `${star.dy}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
      <div
        className="parallax-layer absolute -top-32 -left-24 w-[520px] h-[520px]"
        style={{ "--depth": -0.04 } as CSSProperties}
      >
        <div className="w-full h-full rounded-full bg-accent/10 blur-3xl blob-drift-a" />
      </div>
      <div
        className="parallax-layer absolute bottom-[-15%] -right-24 w-[560px] h-[560px]"
        style={{ "--depth": -0.02 } as CSSProperties}
      >
        <div className="w-full h-full rounded-full bg-accent-2/10 blur-3xl blob-drift-b" />
      </div>
      <div
        className="parallax-layer absolute top-1/2 left-1/2 -ml-[220px] -mt-[220px] w-[440px] h-[440px]"
        style={{ "--depth": -0.06 } as CSSProperties}
      >
        <div
          className="w-full h-full rounded-full bg-accent/5 blur-3xl blob-drift-a"
          style={{ animationDelay: "-9s" }}
        />
      </div>
    </div>
  );
}

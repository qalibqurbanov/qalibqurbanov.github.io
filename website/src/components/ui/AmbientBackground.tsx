import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

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

/** Blurred glow blobs drifting slowly behind the whole page — the
 * ambient motion that keeps the site feeling alive between sections. Dark
 * theme also gets a faint field of individually-animated stars, since stars
 * only read as "night" once the background actually goes dark.
 *
 * The field is one screen tall and repeated down the whole page, as part of the
 * page itself, so it scrolls with the content (like the butterflies). */
export function AmbientBackground() {
  const theme = useThemeValue();
  const stars = useMemo(() => generateStars(STAR_COUNT), []);
  const rootRef = useRef<HTMLDivElement>(null);
  const [tiles, setTiles] = useState(3);

  // One tile per screen height of the page; the container is part of the page, so
  // the browser scrolls it natively (smooth, on the compositor) with no JS.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setTiles(Math.min(40, Math.max(1, Math.ceil(el.offsetHeight / Math.max(1, window.innerHeight)))));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const field = (key: number) => (
    <div key={key} className="relative w-full" style={{ height: "100vh" }}>
      {theme === "dark" &&
        stars.map((star) => (
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
      <div className="absolute -top-32 -left-24 w-[520px] h-[520px]">
        <div className="ambient-blob blob-drift-a" style={{ "--blob": "var(--color-accent)", "--blob-a": "13%" } as CSSProperties} />
      </div>
      <div className="absolute bottom-[-15%] -right-24 w-[560px] h-[560px]">
        <div className="ambient-blob blob-drift-b" style={{ "--blob": "var(--color-accent-2)", "--blob-a": "13%" } as CSSProperties} />
      </div>
      <div className="absolute top-1/2 left-1/2 -ml-[220px] -mt-[220px] w-[440px] h-[440px]">
        <div className="ambient-blob blob-drift-a" style={{ "--blob": "var(--color-accent)", "--blob-a": "7%", animationDelay: "-9s" } as CSSProperties} />
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {Array.from({ length: tiles }, (_, i) => field(i))}
    </div>
  );
}

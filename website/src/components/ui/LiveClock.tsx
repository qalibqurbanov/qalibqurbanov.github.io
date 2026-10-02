import { useEffect, useRef } from "react";

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

function formatTime(now: Date, withMilliseconds: boolean): string {
  const base = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return withMilliseconds ? `${base}.${pad(now.getMilliseconds(), 3)}` : base;
}

/** Local time as HH:MM:SS.mmm, ticking every frame. The text is written
 * straight to the DOM (no React state), so the rest of the footer never
 * re-renders for it. Under reduced motion it drops the milliseconds and ticks
 * once a second instead of flickering. */
export function LiveClock() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const update = () => {
        el.textContent = formatTime(new Date(), false);
      };
      update();
      const id = window.setInterval(update, 1000);
      return () => window.clearInterval(id);
    }

    let frame = 0;
    const tick = () => {
      el.textContent = formatTime(new Date(), true);
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  // Tabular digits keep the width fixed, so the footer doesn't shimmer as the
  // numbers change; the placeholder reserves the space before the first tick.
  return (
    <span ref={ref} className="tabular-nums">
      00:00:00.000
    </span>
  );
}

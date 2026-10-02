import { useEffect, useState } from "react";

import { useInView } from "@/hooks/useInView";

const DURATION_MS = 1100;

/** Counts the leading number of `value` up from zero the first time it
 * scrolls into view ("20+" → 0+ … 20+, "3+ years" → 0+ years … 3+ years).
 * Values that don't start with a number render as they are. */
export function CountUp({ value }: { value: string }) {
  const match = /^(\d+)(.*)$/.exec(value);
  const target = match ? Number(match[1]) : 0;
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { ref, isInView } = useInView<HTMLSpanElement>({ threshold: 0.6 });
  const [count, setCount] = useState(reduced ? target : 0);

  useEffect(() => {
    if (!isInView || reduced || target === 0) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      setCount(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, reduced, target]);

  if (!match) return <>{value}</>;
  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {match[2]}
    </span>
  );
}

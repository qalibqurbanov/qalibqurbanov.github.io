import { useEffect, useState } from "react";

/** The current time, ticking once a minute — enough to feel alive without
 * re-rendering every second for a footer decoration. */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return now;
}

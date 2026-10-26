import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getInitialMotion, getStoredMotion, MOTION_KEY, MOTION_LEVELS, systemPrefersReducedMotion, type Motion } from "@/lib/motion";

import { MotionContext, type MotionContextValue } from "./context";

/**
 * Owns the motion level: keeps `data-motion` on the root element in step with it,
 * remembers an explicit choice in localStorage, and, until the visitor has chosen,
 * follows the device's "reduce motion" setting as it changes. Mount it once near
 * the app root, next to ThemeProvider.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [motion, setMotionState] = useState<Motion>(getInitialMotion);

  useEffect(() => {
    document.documentElement.setAttribute("data-motion", motion);
  }, [motion]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const follow = () => {
      if (getStoredMotion() === null) setMotionState(systemPrefersReducedMotion() ? "light" : "full");
    };
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, []);

  const setMotion = useCallback((next: Motion) => {
    try {
      localStorage.setItem(MOTION_KEY, next);
    } catch {
      // Private mode or blocked storage: the choice just lasts until the page closes.
    }
    // Set at once, not after the next render, so effects started right away already see it.
    document.documentElement.setAttribute("data-motion", next);
    setMotionState(next);
  }, []);

  const cycleMotion = useCallback(() => {
    const next = MOTION_LEVELS[(MOTION_LEVELS.indexOf(motion) + 1) % MOTION_LEVELS.length];
    setMotion(next);
    return next;
  }, [motion, setMotion]);

  const value = useMemo<MotionContextValue>(() => ({ motion, setMotion, cycleMotion }), [motion, setMotion, cycleMotion]);

  return <MotionContext value={value}>{children}</MotionContext>;
}

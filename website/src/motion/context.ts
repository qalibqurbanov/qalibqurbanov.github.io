import { createContext, use } from "react";

import type { Motion } from "@/lib/motion";

export interface MotionContextValue {
  motion: Motion;
  setMotion: (motion: Motion) => void;
  /** Moves to the next level: full, light, off, then back to full. */
  cycleMotion: () => Motion;
}

export const MotionContext = createContext<MotionContextValue | null>(null);

export function useMotion(): MotionContextValue {
  const context = use(MotionContext);
  if (!context) {
    throw new Error("useMotion must be used within a MotionProvider");
  }
  return context;
}

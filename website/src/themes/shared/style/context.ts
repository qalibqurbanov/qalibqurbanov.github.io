import { createContext, use } from "react";

import type { StyleId } from "@/themes";

export interface StyleContextValue {
  style: StyleId;
  setStyle: (style: StyleId) => void;
}

export const StyleContext = createContext<StyleContextValue | null>(null);

export function useStyle(): StyleContextValue {
  const context = use(StyleContext);
  if (!context) {
    throw new Error("useStyle must be used within a StyleProvider");
  }
  return context;
}

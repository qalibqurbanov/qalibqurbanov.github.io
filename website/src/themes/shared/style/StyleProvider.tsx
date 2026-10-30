import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { getInitialStyle, STYLE_KEY, type StyleId } from "@/themes";

import { StyleContext, type StyleContextValue } from "./context";

/** Owns the active visual style: kept on the root element as `data-style` and in localStorage. */
export function StyleProvider({ children }: { children: ReactNode }) {
  const [style, setStyle] = useState<StyleId>(getInitialStyle);

  useEffect(() => {
    document.documentElement.setAttribute("data-style", style);
    localStorage.setItem(STYLE_KEY, style);
  }, [style]);

  const value = useMemo<StyleContextValue>(() => ({ style, setStyle }), [style]);

  return <StyleContext value={value}>{children}</StyleContext>;
}

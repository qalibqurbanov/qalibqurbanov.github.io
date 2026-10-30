import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { glitchScreen } from "@/hooks/glitch";
import { playThemeIntro } from "@/themes/shared/intro";
import { getInitialStyle, STYLE_KEY, type StyleId } from "@/themes";

import { StyleContext, type StyleContextValue } from "./context";

/** Owns the active visual style: kept on the root element as `data-style` and in localStorage. */
export function StyleProvider({ children }: { children: ReactNode }) {
  const [style, setStyle] = useState<StyleId>(getInitialStyle);

  const opened = useRef(style);

  useEffect(() => {
    document.documentElement.setAttribute("data-style", style);
    localStorage.setItem(STYLE_KEY, style);
    // Choosing a style plays its own opening (the original one, a glitch flash); the first render
    // is the page opening, which main.tsx handles.
    if (opened.current === style) return;
    opened.current = style;
    if (!playThemeIntro(style, 0.6)) glitchScreen();
  }, [style]);

  const value = useMemo<StyleContextValue>(() => ({ style, setStyle }), [style]);

  return <StyleContext value={value}>{children}</StyleContext>;
}

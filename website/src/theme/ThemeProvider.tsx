import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { glitchScreen } from "@/hooks/glitch";

import { getInitialTheme, STORAGE_KEY, ThemeContext, type Theme, type ThemeContextValue } from "./context";

/**
 * Owns the theme state, the Ctrl+Shift+L shortcut, and syncing to the DOM +
 * localStorage — all exactly once, no matter how many components read or
 * toggle the theme via `useTheme()`. Mount this once near the app root, the
 * same way LocaleProvider is mounted for i18n.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    glitchScreen();
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isEditable) return;

      const isShortcut = event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "l";
      if (isShortcut) {
        event.preventDefault();
        toggleTheme();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  const value = useMemo<ThemeContextValue>(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

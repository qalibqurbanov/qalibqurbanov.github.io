import { useEffect } from "react";

let logged = false;

/** Prints a hello to whichever "FBI agent" is watching, in the browser
 * console — the one place a curious visitor is guaranteed to look. Guarded
 * by a module-level flag so StrictMode's double-invoked effect in dev
 * doesn't print it twice. Colors are read from the page's own CSS custom
 * properties (not hardcoded hex) so the message matches light/dark theme
 * instead of silently going stale if the palette changes. */
export function useConsoleEasterEgg(): void {
  useEffect(() => {
    if (logged) return;
    logged = true;

    const rootStyle = getComputedStyle(document.documentElement);
    const accent2 = rootStyle.getPropertyValue("--color-accent-2").trim();
    const muted = rootStyle.getPropertyValue("--color-muted").trim();

    console.log(
      "%c🕵️ Special Agent, welcome.",
      `font-family: monospace; font-size: 16px; font-weight: bold; color: ${accent2};`,
    );
    console.log(
      "%cEveryone knows the FBI tracks this website — might as well star a repo while you're here.",
      `font-family: monospace; font-size: 12px; color: ${muted};`,
    );
  }, []);
}

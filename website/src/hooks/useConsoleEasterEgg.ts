import { useEffect } from "react";

let logged = false;

/** Prints a hello to whichever "FBI agent" is watching, in the browser
 * console — the one place a curious visitor is guaranteed to look. Guarded
 * by a module-level flag so StrictMode's double-invoked effect in dev
 * doesn't print it twice. */
export function useConsoleEasterEgg(): void {
  useEffect(() => {
    if (logged) return;
    logged = true;

    console.log(
      "%c🕵️ Special Agent, welcome.",
      "font-family: monospace; font-size: 16px; font-weight: bold; color: #8b8cf6;",
    );
    console.log(
      "%cEveryone knows the FBI tracks this website — might as well star a repo while you're here.",
      "font-family: monospace; font-size: 12px; color: #8a8a96;",
    );
  }, []);
}

import { useEffect } from "react";

let logged = false;

/** Prints a friendly hello in the browser console — the one place a curious
 * visitor (or the FBI agent someone joked would be watching this site) is
 * guaranteed to look. Guarded by a module-level flag so StrictMode's
 * double-invoked effect in dev doesn't print it twice. */
export function useConsoleEasterEgg(): void {
  useEffect(() => {
    if (logged) return;
    logged = true;

    console.log(
      "%c👋 Hey there.",
      "font-family: monospace; font-size: 16px; font-weight: bold; color: #8b8cf6;",
    );
    console.log(
      "%cIf you're the FBI agent assigned to monitor this site: I promise the wildest thing here is my CSS.",
      "font-family: monospace; font-size: 12px; color: #8a8a96;",
    );
  }, []);
}

import { useEffect } from "react";

/** When the URL's hash names an element on the page (a navbar link, or a copied section link),
 * scrolls to it. Runs on mount (opening the link fresh) and on every hashchange after. */
export function useHashSectionFocus(): void {
  useEffect(() => {
    let stopWatching: (() => void) | undefined;

    /** The lazy sections mount a moment after the first render, so a fresh visit to `/#skills` finds
     * nothing yet. Watches the page until the target shows up (or gives up), then scrolls. */
    function waitForTarget(id: string) {
      stopWatching?.();
      const observer = new MutationObserver(() => {
        if (!document.getElementById(id)) return;
        stopWatching?.();
        scrollToHash();
      });
      const timer = window.setTimeout(() => stopWatching?.(), 5000);
      observer.observe(document.body, { childList: true, subtree: true });
      stopWatching = () => {
        observer.disconnect();
        window.clearTimeout(timer);
        stopWatching = undefined;
      };
    }

    function scrollToHash() {
      stopWatching?.();
      const id = window.location.hash.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) {
        waitForTarget(id);
        return;
      }
      el.scrollIntoView({ block: "start" });
    }

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      stopWatching?.();
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);
}

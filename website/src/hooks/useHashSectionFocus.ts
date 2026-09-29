import { useEffect } from "react";

/** Runs the section-focus-highlight animation on `el` once — restarted by
 * removing and re-adding the class, since re-adding the same class while
 * it's already present wouldn't restart a running/finished CSS animation. */
function playFocusHighlight(el: HTMLElement) {
  el.classList.remove("section-focus-highlight");
  // Force a reflow so the browser registers the class removal before it's
  // added back, otherwise both changes collapse into a no-op.
  void el.offsetWidth;
  el.classList.add("section-focus-highlight");
}

/** When the URL's hash names an element on the page (e.g. from the context
 * menu's "Copy page link", which points at whichever section was under the
 * cursor), scrolls to it and plays a brief highlight so arriving there reads
 * as "you landed here" rather than a quiet, easy-to-miss jump. Runs on
 * mount (covers opening the link fresh) and on every hashchange after. */
export function useHashSectionFocus(): void {
  useEffect(() => {
    function focusFromHash() {
      const id = window.location.hash.slice(1);
      if (!id) return;

      const el = document.getElementById(id);
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "start" });
      playFocusHighlight(el);
    }

    focusFromHash();
    window.addEventListener("hashchange", focusFromHash);
    return () => window.removeEventListener("hashchange", focusFromHash);
  }, []);
}

import { useEffect } from "react";

import { scanWipe, triggerGlitch } from "@/hooks/glitch";

/** Runs a one-shot highlight animation on `el` — restarted by removing and
 * re-adding the class, since re-adding the same class while it's already
 * present wouldn't restart a running/finished CSS animation. */
function playHighlight(el: HTMLElement, className: string) {
  el.classList.remove(className);
  // Force a reflow so the browser registers the class removal before it's
  // added back, otherwise both changes collapse into a no-op.
  void el.offsetWidth;
  el.classList.add(className);
}

/** Highlights the section the visitor just arrived at. The section's own
 * edge ring is mostly off-screen (sections are tall), so the heading — the
 * thing actually in view — gets a glow too. */
function playFocusHighlight(section: HTMLElement) {
  playHighlight(section, "section-focus-highlight");
  const heading = section.querySelector<HTMLElement>("h1, h2");
  if (heading) playHighlight(heading, "heading-focus-highlight");
  triggerGlitch(section);
}

/** When the URL's hash names an element on the page (a navbar link, or the
 * context menu's "Copy page link" pointing at whichever section was under the
 * cursor), scrolls to it and highlights it once the scroll has settled, so
 * the cue isn't spent while the page is still flying past. Runs on mount
 * (covers opening the link fresh) and on every hashchange after. */
export function useHashSectionFocus(): void {
  useEffect(() => {
    let cancelScrollWait: (() => void) | undefined;

    function focusFromHash() {
      cancelScrollWait?.();
      const id = window.location.hash.slice(1);
      if (!id) return;

      const el = document.getElementById(id);
      if (!el) return;

      // Centre the section on screen. One taller than the viewport can't be
      // centred without cutting off its heading, so it's aligned to the top.
      const rect = el.getBoundingClientRect();
      const fits = rect.height <= window.innerHeight;
      const targetTop = fits ? (window.innerHeight - rect.height) / 2 : 0;
      const alreadyThere = Math.abs(rect.top - targetTop) < 2;
      el.scrollIntoView({ behavior: "smooth", block: fits ? "center" : "start" });
      if (alreadyThere) {
        playFocusHighlight(el);
        return;
      }
      scanWipe(rect.top > targetTop ? "down" : "up");

      // `scrollend` isn't universal, so a timer backs it up.
      const play = () => {
        cancelScrollWait?.();
        playFocusHighlight(el);
      };
      const timer = window.setTimeout(play, 1000);
      window.addEventListener("scrollend", play, { once: true });
      cancelScrollWait = () => {
        window.clearTimeout(timer);
        window.removeEventListener("scrollend", play);
        cancelScrollWait = undefined;
      };
    }

    // Re-clicking a link whose hash is already in the URL fires no
    // `hashchange`, so in-page anchors are also handled on click — that's what
    // lets the highlight replay every time, not just the first arrival.
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href^='#']");
      const hash = anchor?.getAttribute("href");
      if (!hash || hash.length < 2 || hash.startsWith("#/")) return;
      if (hash !== window.location.hash) return; // a real hashchange will follow
      event.preventDefault();
      focusFromHash();
    }

    focusFromHash();
    window.addEventListener("hashchange", focusFromHash);
    document.addEventListener("click", handleClick);
    return () => {
      cancelScrollWait?.();
      window.removeEventListener("hashchange", focusFromHash);
      document.removeEventListener("click", handleClick);
    };
  }, []);
}

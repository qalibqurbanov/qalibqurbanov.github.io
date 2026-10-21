/** Marks each element `data-offscreen` while it is scrolled out of view, so its
 * CSS animations can be paused (see `[data-offscreen]` in index.css): a drifting
 * blob or a twinkling star nobody can see should cost nothing. Returns the stop function. */
export function pauseWhenOffscreen(elements: Iterable<Element>): () => void {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.removeAttribute("data-offscreen");
        else entry.target.setAttribute("data-offscreen", "");
      }
    },
    { rootMargin: "120px 0px" },
  );
  for (const el of elements) observer.observe(el);
  return () => {
    observer.disconnect();
    for (const el of elements) el.removeAttribute("data-offscreen");
  };
}

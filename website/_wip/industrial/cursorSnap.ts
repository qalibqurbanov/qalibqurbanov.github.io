/** Puts the Industrial cursor exactly on the pointer, with no easing: on every pointer move it writes the position
 * into two CSS variables of the cursor layer, which cursor.css turns into the cursor's transform. It exists only
 * while the Industrial scene does, and removes the variables when the style is left. */
export function startCursorSnap(): () => void {
  let layer: HTMLElement | null = null;

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    if (!layer?.isConnected) layer = document.querySelector<HTMLElement>(".theme-cursor");
    if (!layer) return;
    layer.style.setProperty("--ind-x", `${event.clientX}px`);
    layer.style.setProperty("--ind-y", `${event.clientY}px`);
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  return () => {
    window.removeEventListener("pointermove", onMove);
    layer?.style.removeProperty("--ind-x");
    layer?.style.removeProperty("--ind-y");
  };
}

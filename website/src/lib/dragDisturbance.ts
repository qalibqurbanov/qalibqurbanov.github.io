export interface DisturbanceRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

let currentRect: DisturbanceRect | null = null;
const listeners = new Set<() => void>();

/** Broadcasts the dragged window's live bounding rect (or null once it's
 * released) so unrelated elements elsewhere on the page — e.g. the header —
 * can react to it without prop-drilling or a context provider. */
export function publishDisturbance(rect: DisturbanceRect | null) {
  currentRect = rect;
  listeners.forEach((listener) => listener());
}

export function subscribeDisturbance(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDisturbanceRect() {
  return currentRect;
}

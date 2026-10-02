import { useSyncExternalStore } from "react";

export interface ViewBar {
  label: string;
  onBack: () => void;
}

// A tiny external store: the open view (project, resume, contact) registers its
// "back" action here, and the navbar swaps itself into a back-bar to show it —
// so the menu the visitor sees is literally the same one, not a lookalike.
let current: ViewBar | null = null;
const listeners = new Set<() => void>();

export function setViewBar(next: ViewBar | null) {
  current = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useViewBar(): ViewBar | null {
  return useSyncExternalStore(subscribe, () => current);
}

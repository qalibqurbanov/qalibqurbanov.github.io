import { useSyncExternalStore } from "react";

import type { LiveSource, LiveState } from "@/lib/liveSource";

const NOTHING: LiveState<never> = { value: null, live: false };
const noSubscribe = () => () => {};
const noSnapshot = () => NOTHING;

/** Reads a LiveSource (see lib/liveSource.ts); re-renders whenever it changes.
 * A null source — e.g. a URL that is not a GitHub repository — reads as empty. */
export function useLiveSource<T>(source: LiveSource<T> | null): LiveState<T> {
  return useSyncExternalStore(
    source ? source.subscribe : noSubscribe,
    source ? source.getSnapshot : (noSnapshot as () => LiveState<T>),
  );
}

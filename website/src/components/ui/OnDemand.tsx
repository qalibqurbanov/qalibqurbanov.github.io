import type { ComponentType } from "react";
import { Suspense, useEffect, useState } from "react";

/** Fires `event` once, as soon as it mounts — after the component rendered before it has set up its listener. */
function Replay({ event }: { event: string }) {
  useEffect(() => {
    window.dispatchEvent(new Event(event));
  }, [event]);
  return null;
}

/** Mounts a lazily loaded component the first time something asks for it: the
 * `event` is dispatched, or `shortcut` accepts a key press. The request is then
 * replayed once the component is there, so the first use opens it as if it had
 * been mounted all along. */
export function OnDemand({
  component: Component,
  event,
  shortcut,
}: {
  component: ComponentType;
  event: string;
  shortcut?: (event: KeyboardEvent) => boolean;
}) {
  const [wanted, setWanted] = useState(false);

  useEffect(() => {
    if (wanted) return;
    const request = () => setWanted(true);
    const onKey = (keyEvent: KeyboardEvent) => {
      if (!shortcut?.(keyEvent)) return;
      keyEvent.preventDefault();
      request();
    };
    window.addEventListener(event, request);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(event, request);
      window.removeEventListener("keydown", onKey);
    };
  }, [wanted, event, shortcut]);

  if (!wanted) return null;
  return (
    <Suspense fallback={null}>
      <Component />
      <Replay event={event} />
    </Suspense>
  );
}

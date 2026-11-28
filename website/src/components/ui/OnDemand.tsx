import type { ComponentType } from "react";
import { Suspense, useEffect, useState } from "react";

/** Fires the request again once, as soon as it mounts — after the component rendered before it has set up its
 * listener. A copy of the original event is sent, so anything it carried (such as a CustomEvent's detail) arrives too. */
function Replay({ event }: { event: Event }) {
  useEffect(() => {
    const copy = event instanceof CustomEvent ? new CustomEvent(event.type, { detail: event.detail }) : new Event(event.type);
    window.dispatchEvent(copy);
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
  const [request, setRequest] = useState<Event | null>(null);

  useEffect(() => {
    if (request) return;
    const onRequest = (requestEvent: Event) => setRequest(requestEvent);
    const onKey = (keyEvent: KeyboardEvent) => {
      if (!shortcut?.(keyEvent)) return;
      keyEvent.preventDefault();
      setRequest(new Event(event));
    };
    window.addEventListener(event, onRequest);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(event, onRequest);
      window.removeEventListener("keydown", onKey);
    };
  }, [request, event, shortcut]);

  if (!request) return null;
  return (
    <Suspense fallback={null}>
      <Component />
      <Replay event={request} />
    </Suspense>
  );
}

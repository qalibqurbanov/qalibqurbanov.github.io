import { useEffect, useRef } from "react";

interface TurnstileOptions {
  sitekey: string;
  appearance: "always" | "execute" | "interaction-only";
  theme: "light" | "dark" | "auto";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
}

interface TurnstileApi {
  render: (host: HTMLElement, options: TurnstileOptions) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<void> | null = null;

/** Loads Cloudflare's script once, the first time a form needs it. */
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("turnstile script"));
    };
    document.head.append(script);
  });
  return loading;
}

interface TurnstileProps {
  siteKey: string;
  /** The check passed: the token goes along with the message. */
  onToken: (token: string) => void;
  /** The token ran out or the check failed; a new one is being fetched. */
  onExpire: () => void;
  /** The script could not be loaded at all (blocked, offline). */
  onUnavailable: () => void;
  /** A token works once: raise this after each attempt to get a fresh one. */
  resetKey: number;
}

/** Cloudflare Turnstile, the spam check on the contact form. It stays invisible
 * and only shows something when it cannot tell a visitor from a script. */
export function Turnstile({ siteKey, onToken, onExpire, onUnavailable, resetKey }: TurnstileProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(null);
  const handlers = useRef({ onToken, onExpire, onUnavailable });

  useEffect(() => {
    handlers.current = { onToken, onExpire, onUnavailable };
  });

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        const api = window.turnstile;
        if (cancelled || !hostRef.current || !api) return;
        idRef.current = api.render(hostRef.current, {
          sitekey: siteKey,
          appearance: "interaction-only",
          theme: "dark",
          callback: (token) => handlers.current.onToken(token),
          "expired-callback": () => handlers.current.onExpire(),
          "error-callback": () => handlers.current.onExpire(),
        });
      })
      .catch(() => {
        if (!cancelled) handlers.current.onUnavailable();
      });
    return () => {
      cancelled = true;
      if (idRef.current) window.turnstile?.remove(idRef.current);
      idRef.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey > 0 && idRef.current) window.turnstile?.reset(idRef.current);
  }, [resetKey]);

  return <div ref={hostRef} className="flex justify-center empty:hidden" />;
}

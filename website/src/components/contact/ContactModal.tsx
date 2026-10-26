import * as Dialog from "@radix-ui/react-dialog";
import { Check, CheckCircle2, CircleAlert, Clock, Mail, Paperclip, Send, X } from "lucide-react";
import type { CSSProperties, DragEvent, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { borderBurst } from "@/hooks/borderGlitch";
import { prefersReducedMotion, SCRAMBLE } from "@/hooks/glitch";

import { CodeWindow } from "@/components/ui/CodeWindow";
import { ViewModal } from "@/components/ui/ViewModal";
import { useContent, useLocale } from "@/i18n/context";
import { getLocaleMeta } from "@/i18n/locale";
import { OPEN_CONTACT_EVENT } from "@/components/contact/openContact";
import { Turnstile } from "@/components/contact/Turnstile";
import { format } from "@/lib/format";

/** Where the form is delivered. Set `VITE_CONTACT_ENDPOINT` to a form-relay
 * URL (Formspree, Web3Forms…); `VITE_CONTACT_ACCESS_KEY` is forwarded as
 * `access_key` for services that want one. Without an endpoint the form does
 * not pretend: it hands the message to the visitor's own email app. */
const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;
const ACCESS_KEY = import.meta.env.VITE_CONTACT_ACCESS_KEY as
  string | undefined;

/** A second form service, tried only when the first one fails. It takes the same
 * `VITE_CONTACT_ACCESS_KEY` (Web3Forms: https://api.web3forms.com/submit). */
const FALLBACK_ENDPOINT = import.meta.env.VITE_CONTACT_FALLBACK_ENDPOINT as string | undefined;

/** The Cloudflare Turnstile site key (public). With it the form runs the spam check and
 * sends its token to the mail Cloudflare Worker, which verifies it. */
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

/** Attachments need a plan that accepts files (the free tiers of the usual services do not): they are only offered when this is switched on. */
const ATTACHMENTS = import.meta.env.VITE_CONTACT_ATTACHMENTS === "true";

/** After a message is sent the tick stays on the button this long, then the window closes itself. */
const TICK_MS = 1800;
/** How long the window glitches before it closes. */
const GLITCH_MS = 450;

/** A plain check that an address has an @ and a dot after it; the mail service does the real one. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** A notice about the form or a failed send goes away by itself after this long. */
const NOTICE_MS = 8000;

/** The most characters a message can have (the form stops typing there). */
const MESSAGE_MAX = 4000;

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;

/** A form submitted sooner than this after it opened was not filled in by a person. */
const MIN_FILL_MS = 2500;
/** At most this many messages per window, and never two closer together than the gap
 * (kept in this browser only: it slows down a script or an impatient visitor, nothing more). */
const MAX_PER_WINDOW = 3;
const WINDOW_MS = 60 * 60 * 1000;
const MIN_GAP_MS = 30 * 1000;
const SENT_KEY = "contact:sent";
/** A mailto link carries the whole message in its URL; mail apps cope with about this much. */
const MAILTO_BODY_MAX = 1800;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The times this browser sent a message within the window (storage may be unavailable). */
function recentSends(now: number): number[] {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(SENT_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((t): t is number => typeof t === "number" && now - t < WINDOW_MS) : [];
  } catch {
    return [];
  }
}

function rememberSend(now: number): void {
  try {
    window.localStorage.setItem(SENT_KEY, JSON.stringify([...recentSends(now), now]));
  } catch {
    // Private mode or blocked storage: the limit simply does not apply.
  }
}

/** A "please wait" that is still running is kept here, so closing and opening the window
 * again shows it again, with the time that is left, until it ends. */
const WAIT_KEY = "contact:wait";
/** Why the form is waiting: sent right after opening, sent again too soon, this browser's hourly limit, or
 * the hourly limit of the internet connection (set by the mail Cloudflare Worker). */
type WaitKind = "fast" | "pause" | "limit" | "server";
const WAIT_KINDS: string[] = ["fast", "pause", "limit", "server"];
/** The messages an hour that one internet connection may send. Keep it equal to LIMIT in worker/index.js (and to MAX_PER_WINDOW, so every message in the form says the same number). */
const SERVER_LIMIT = 3;

function readWait(): { until: number; total: number; kind: WaitKind } | null {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(WAIT_KEY) ?? "null");
    if (typeof raw === "object" && raw !== null && "until" in raw && "total" in raw && typeof raw.until === "number" && typeof raw.total === "number" && raw.total > 0) {
      const kind = "kind" in raw && typeof raw.kind === "string" && WAIT_KINDS.includes(raw.kind) ? (raw.kind as WaitKind) : "limit";
      return { until: raw.until, total: raw.total, kind };
    }
  } catch {
    // Storage unavailable: the wait is simply not remembered.
  }
  return null;
}

function writeWait(ms: number, kind: WaitKind): void {
  try {
    window.localStorage.setItem(WAIT_KEY, JSON.stringify({ until: Date.now() + ms, total: ms, kind }));
  } catch {
    // Private mode or blocked storage.
  }
}

function clearWait(): void {
  try {
    window.localStorage.removeItem(WAIT_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** How a post went: accepted, turned away for sending too much, refused for another
 * reason (the spam check, bad fields) or not answered at all (down, offline). */
type Outcome = "ok" | "limited" | "refused" | "failed";
/** `retryAfter` (seconds) comes with "limited" from the mail service, which says how long to wait. */
interface Result {
  outcome: Outcome;
  retryAfter?: number;
}

/** The time of day as on a 24-hour clock, such as "14:05". */
function formatClock(ms: number, bcp47: string): string {
  return new Intl.DateTimeFormat(bcp47, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(ms);
}

/** "23 seconds" or "12 minutes", in the page's language. */
function formatWait(seconds: number, bcp47: string): string {
  const minutes = seconds >= 60;
  return new Intl.NumberFormat(bcp47, { style: "unit", unit: minutes ? "minute" : "second", unitDisplay: "long" }).format(minutes ? Math.ceil(seconds / 60) : seconds);
}

/** Posts the message to one service. */
async function deliver(
  endpoint: string,
  accessKey: string | undefined,
  { name, email, message }: { name: string; email: string; message: string },
  attachments: File[],
  checkToken: string | null,
): Promise<Result> {
  try {
    // Multipart, so attachments can ride along with the text fields.
    const body = new FormData();
    if (accessKey) body.append("access_key", accessKey);
    body.append("name", name);
    body.append("email", email);
    body.append("message", message);
    body.append("subject", `Portfolio - ${name} sent you a message`);
    body.append("page", window.location.href);
    if (checkToken) body.append("cf-turnstile-response", checkToken);
    for (const file of attachments) body.append("attachment", file, file.name);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
    });
    if (response.status === 429) return { outcome: "limited", retryAfter: Number(response.headers.get("Retry-After")) || undefined };
    if (response.status >= 500) return { outcome: "failed" };
    // The services answer with JSON that says whether they accepted the message (Web3Forms: `success`, Formspree and the mail worker: `ok`).
    const reply: unknown = await response.json().catch(() => null);
    const refused = typeof reply === "object" && reply !== null && ("success" in reply ? reply.success === false : "ok" in reply ? reply.ok === false : false);
    return { outcome: response.ok && !refused ? "ok" : "refused" };
  } catch {
    return { outcome: "failed" };
  }
}

/** After a message is sent the window stays a moment, with a tick on its button, then its border
 * glitches and `onDone` closes it. It draws nothing itself. */
function CloseSoon({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    let closeTimer = 0;
    const end = window.setTimeout(() => {
      const win = rootRef.current?.closest<HTMLElement>(".glitch-border");
      if (win) borderBurst(win, 14);
      closeTimer = window.setTimeout(() => doneRef.current(), GLITCH_MS);
    }, TICK_MS);
    return () => {
      window.clearTimeout(end);
      window.clearTimeout(closeTimer);
    };
  }, []);

  return <span ref={rootRef} hidden />;
}

/** What the Send button shows once the message is sent: a tick that pops in and draws itself (see .sent-tick). */
function SentTick({ label }: { label: string }) {
  return <Check size={20} strokeWidth={3} role="img" aria-label={label} className="sent-tick" />;
}

type Field = "name" | "email" | "message";

/** How long the popup's glitch-out lasts before it is gone. */
const NOTICE_OUT_MS = 340;

/** The word on the Send button while a message is on its way: its letters scramble into noise and
 * lock back into place, left to right, over and over until the send is over. The button's font has
 * letters of equal width, so nothing around it moves. */
const SCRAMBLE_CYCLE_MS = 1500;
function ScrambleText({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const start = performance.now();
    const id = window.setInterval(() => {
      const progress = ((performance.now() - start) % SCRAMBLE_CYCLE_MS) / SCRAMBLE_CYCLE_MS;
      // Locks in over the first 70% of the cycle, holds the real word, then scrambles again.
      const locked = progress < 0.7 ? Math.floor((progress / 0.7) * text.length) : progress < 0.85 ? text.length : 0;
      let out = "";
      for (let i = 0; i < text.length; i++) {
        out += i < locked || text[i] === " " ? text[i] : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
      }
      setShown(out);
    }, 60);
    return () => window.clearInterval(id);
  }, [text]);
  return (
    <span aria-label={text}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

/** A small window at the top right of the screen, in the site's own window style: what is
 * wrong with the form, why a send failed, or how long to wait. It glitches in, and glitches
 * out when it is closed. A bar along its bottom edge runs down over `lifeMs` and the popup
 * closes itself when it is empty; the X in its title bar closes it sooner. */
function Notice({ tone, icon, onClose, lifeMs, from = 1, children }: { tone: "danger" | "info" | "success"; icon: ReactNode; onClose: () => void; lifeMs: number; from?: number; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const leavingRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    closeRef.current = onClose;
  });

  const glitchBorder = useCallback((frames: number) => {
    const win = rootRef.current?.querySelector<HTMLElement>(".glitch-border");
    if (win) borderBurst(win, frames);
  }, []);

  const dismiss = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    glitchBorder(10);
    window.setTimeout(() => closeRef.current(), prefersReducedMotion() ? 0 : NOTICE_OUT_MS);
  }, [glitchBorder]);

  useEffect(() => {
    const glitchIn = window.setTimeout(() => glitchBorder(10), 80);
    const life = window.setTimeout(dismiss, lifeMs);
    return () => {
      window.clearTimeout(glitchIn);
      window.clearTimeout(life);
    };
  }, [lifeMs, dismiss, glitchBorder]);

  const danger = tone === "danger";
  return (
    <div
      ref={rootRef}
      role={danger ? "alert" : "status"}
      className={`${leaving ? "notice-out" : "notice-in"} fixed right-4 top-20 z-[70] w-[min(22rem,calc(100vw-2rem))]`}
    >
      <CodeWindow
        filename={danger ? "error.log" : tone === "success" ? "sent.log" : "wait.log"}
        onClose={dismiss}
        footer={
          <div className="h-0.5 w-full bg-surface-2" role="presentation">
            <div
              className={`notice-bar h-full origin-left ${danger ? "bg-danger" : tone === "success" ? "bg-gradient-to-r from-accent to-accent-2" : "bg-accent"}`}
              style={{ animationDuration: `${lifeMs}ms`, "--notice-from": from } as CSSProperties}
            />
          </div>
        }
      >
        <div className={`flex items-start gap-2.5 p-3 font-mono text-xs leading-relaxed ${danger ? "text-danger" : "text-text"}`}>
          <span className={`mt-px shrink-0 ${danger ? "" : tone === "success" ? "text-accent-2" : "text-accent"}`}>{icon}</span>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </CodeWindow>
    </div>
  );
}

type Status = "idle" | "sending" | "sent" | "mail" | "error" | "limited" | "tooMany";

const FIELD =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-2 font-sans text-sm text-text placeholder:text-muted/60 outline-none transition focus:border-accent selectable";

export function ContactModal() {
  const { profile, ui } = useContent();
  const { locale } = useLocale();
  const t = ui.contactModal;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const openedAt = useRef(0);
  const canSend = Boolean(ENDPOINT);
  const canAttach = canSend && ATTACHMENTS;
  // How long a "wait a moment" message still has to wait (ms): it counts the seconds down and goes away by itself.
  const [waitMs, setWaitMs] = useState(0);
  const [waitTotalMs, setWaitTotalMs] = useState(0);
  // How full the wait popup's bar is when it shows: less than full when it comes back while the wait is half over.
  const [waitFrom, setWaitFrom] = useState(1);
  // Why the form waits, and the time of day the wait ends (shown to the visitor).
  const [waitKind, setWaitKind] = useState<WaitKind>("pause");
  const [waitEndsAt, setWaitEndsAt] = useState(0);
  // What is wrong with the fields after a send was tried: shown in a notice, and the fields get a red edge.
  const [problems, setProblems] = useState<{ field: Field; text: string }[]>([]);
  const [invalid, setInvalid] = useState<Field[]>([]);
  // The popup after a send. It is shown outside the window, so it stays when the window closes.
  const [sentNotice, setSentNotice] = useState<{ id: number; title: string; body: string } | null>(null);
  // Counts the send attempts, so each popup is a new one (and glitches in again).
  const [round, setRound] = useState(0);
  const checked = canSend && Boolean(SITE_KEY);
  // The spam check's token: fetched in the background, so the form can only be sent once it is there.
  const checkToken = useRef<string | null>(null);
  const [check, setCheck] = useState<"pending" | "ready" | "unavailable">(checked ? "pending" : "ready");
  const [checkRound, setCheckRound] = useState(0);
  // When this browser sent its messages within the last hour: the counter under the Send button.
  const [sentTimes, setSentTimes] = useState<number[]>([]);

  useEffect(() => {
    const onOpen = () => {
      const stored = readWait();
      const left = stored ? stored.until - Date.now() : 0;
      if (stored && left > 0) {
        // A wait is still running: its popup comes back with the time that is left.
        setWaitMs(left);
        setWaitTotalMs(left);
        setWaitFrom(Math.min(1, left / stored.total));
        setWaitKind(stored.kind);
        setWaitEndsAt(stored.until);
        setRound((count) => count + 1);
        setStatus("limited");
      } else {
        clearWait();
        setStatus("idle");
      }
      setFiles([]);
      setFileError(false);
      setProblems([]);
      setInvalid([]);
      setSentTimes(recentSends(Date.now()));
      checkToken.current = null;
      setCheck(checked ? "pending" : "ready");
      openedAt.current = Date.now();
      setOpen(true);
    };
    window.addEventListener(OPEN_CONTACT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONTACT_EVENT, onOpen);
  }, [checked]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setSentTimes(recentSends(Date.now())), 15_000);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (status !== "limited") return;
    const id = window.setInterval(() => setWaitMs((left) => left - 1000), 1000);
    return () => window.clearInterval(id);
  }, [status]);


  function startWait(ms: number, kind: WaitKind) {
    writeWait(ms, kind);
    setWaitMs(ms);
    setWaitTotalMs(ms);
    setWaitFrom(1);
    setWaitKind(kind);
    setWaitEndsAt(Date.now() + ms);
  }

  function addFiles(incoming: FileList | File[]) {
    const merged = [...files];
    for (const file of Array.from(incoming)) {
      if (!merged.some((f) => f.name === file.name && f.size === file.size))
        merged.push(file);
    }
    const total = merged.reduce((sum, f) => sum + f.size, 0);
    if (merged.length > MAX_FILES || total > MAX_TOTAL_BYTES) {
      setFileError(true);
      return;
    }
    setFileError(false);
    setFiles(merged);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Already sent (the tick is showing): a second press does nothing.
    if (status === "sending" || status === "sent" || status === "mail") return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    // Honeypot: real users never see or fill this field.
    if (form.get("hp_field")) return;
    const name = String(form.get("name") ?? "");
    const message = String(form.get("message") ?? "");
    const email = String(form.get("email") ?? "");
    const found: { field: Field; text: string }[] = [];
    if (!name.trim()) found.push({ field: "name", text: t.needName });
    if (!EMAIL_PATTERN.test(email.trim())) found.push({ field: "email", text: t.needEmail });
    if (!message.trim()) found.push({ field: "message", text: t.needMessage });
    setProblems(found);
    setInvalid(found.map((problem) => problem.field));
    setRound((count) => count + 1);
    if (found.length > 0) {
      setStatus("idle");
      (formElement.elements.namedItem(found[0].field) as HTMLElement | null)?.focus();
      return;
    }
    const now = Date.now();
    const sends = recentSends(now);
    // How long until the form may be sent: the longest of the waits that apply.
    const waits: { ms: number; kind: WaitKind }[] = [];
    if (now - openedAt.current < MIN_FILL_MS) waits.push({ ms: MIN_FILL_MS - (now - openedAt.current), kind: "fast" });
    if (sends.length > 0 && now - Math.max(...sends) < MIN_GAP_MS) waits.push({ ms: MIN_GAP_MS - (now - Math.max(...sends)), kind: "pause" });
    const stored = readWait();
    if (stored && stored.until > now) waits.push({ ms: stored.until - now, kind: stored.kind });
    if (sends.length >= MAX_PER_WINDOW) waits.push({ ms: [...sends].sort((a, b) => a - b)[sends.length - MAX_PER_WINDOW] + WINDOW_MS - now, kind: "limit" });
    if (waits.length > 0) {
      const longest = waits.reduce((a, b) => (b.ms > a.ms ? b : a));
      startWait(longest.ms, longest.kind);
      setStatus("limited");
      return;
    }
    if (!ENDPOINT) {
      // No form service behind this site: the visitor's own email app sends it.
      const body = `${message}\n\n— ${name} <${email}>`;
      const clipped = body.length > MAILTO_BODY_MAX ? `${body.slice(0, MAILTO_BODY_MAX)}…` : body;
      rememberSend(now);
      setSentTimes(recentSends(now));
      setSentNotice({ id: now, title: t.mailTitle, body: format(t.mailBody, { email: profile.email }) });
      setStatus("mail");
      window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(`Portfolio - ${name} sent you a message`)}&body=${encodeURIComponent(clipped)}`;
      return;
    }

    setStatus("sending");
    const fields = { name, email, message };
    let { outcome, retryAfter } = await deliver(ENDPOINT, ACCESS_KEY, fields, canAttach ? files : [], checkToken.current);
    // Only a mail service that is down hands over to the backup. A refusal (spam check, too many messages) is final, or the backup would let spam around it.
    if (outcome === "failed" && FALLBACK_ENDPOINT) ({ outcome, retryAfter } = await deliver(FALLBACK_ENDPOINT, ACCESS_KEY, fields, [], null));
    if (outcome === "ok") {
      rememberSend(Date.now());
      setSentTimes(recentSends(Date.now()));
      setSentNotice({ id: Date.now(), title: t.successTitle, body: t.successBody });
    }
    // With no time from the mail service there is no countdown to show, so the notice just says so.
    if (outcome === "limited" && retryAfter) startWait(retryAfter * 1000, "server");
    setStatus(outcome === "ok" ? "sent" : outcome === "limited" ? (retryAfter ? "limited" : "tooMany") : "error");
    if (outcome !== "ok" && checked) {
      // A token works once: ask for a new one before the next try.
      checkToken.current = null;
      setCheck("pending");
      setCheckRound((round) => round + 1);
    }
  }

  const done = status === "sent" || status === "mail";
  const bcp47 = getLocaleMeta(locale).bcp47;
  const waitTemplate = { fast: t.waitFast, pause: t.waitPause, limit: t.waitLimit, server: t.waitServer }[waitKind];
  const waitText =
    status === "limited"
      ? format(waitTemplate, {
          time: formatWait(Math.max(1, Math.ceil(waitMs / 1000)), bcp47),
          clock: formatClock(waitEndsAt, bcp47),
          seconds: String(MIN_GAP_MS / 1000),
          count: String(waitKind === "server" ? SERVER_LIMIT : MAX_PER_WINDOW),
        })
      : null;
  const fieldClass = (field: Field, extra = "") => `${FIELD} ${extra} ${invalid.includes(field) ? "border-danger!" : ""}`;

  return (
    <>
    <ViewModal open={open} widthClass="max-w-xl" onClose={() => setOpen(false)}>
      {(close) => (
      <CodeWindow
        filename="message.txt"
        className="flex min-h-0 flex-col"
        onClose={close}
      >
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6">
          <form
            noValidate
            onSubmit={handleSubmit}
            onInput={(event) => {
              const field = (event.target as HTMLInputElement).name;
              setInvalid((list) => list.filter((name) => name !== field));
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <Dialog.Title className="text-xl font-bold text-text">
                {t.title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted">
                {t.description}
              </Dialog.Description>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted/80">
                {format(t.limits, { count: String(MAX_PER_WINDOW), seconds: String(MIN_GAP_MS / 1000), chars: String(MESSAGE_MAX) })}
              </p>
            </div>

            <label className="flex flex-col gap-1.5 font-mono text-xs text-muted">
              {t.nameLabel}
              <input
                name="name"
                required
                maxLength={100}
                autoComplete="name"
                aria-invalid={invalid.includes("name")}
                className={fieldClass("name")}
              />
            </label>
            <label className="flex flex-col gap-1.5 font-mono text-xs text-muted">
              {t.emailLabel}
              <input
                name="email"
                type="email"
                required
                maxLength={200}
                autoComplete="email"
                aria-invalid={invalid.includes("email")}
                className={fieldClass("email")}
              />
            </label>
            <label className="flex flex-col gap-1.5 font-mono text-xs text-muted">
              {t.messageLabel}
              <textarea
                name="message"
                required
                rows={5}
                maxLength={MESSAGE_MAX}
                aria-invalid={invalid.includes("message")}
                className={fieldClass("message", "custom-scrollbar [--scrollbar-track:var(--color-surface-2)] resize-none")}
              />
            </label>
            {canAttach && (
              <div className="flex flex-col gap-1.5 font-mono text-xs text-muted">
                {t.attachLabel}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      inputRef.current?.click();
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-4 text-center transition ${
                    dragging
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface-2 hover:border-accent"
                  }`}
                >
                  <Paperclip size={14} className="shrink-0" />
                  {dragging ? t.dropActive : t.dropHint}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files) addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                {fileError && (
                  <p role="alert" className="text-danger">
                    {format(t.filesTooLarge, {
                      max: formatSize(MAX_TOTAL_BYTES),
                      count: String(MAX_FILES),
                    })}
                  </p>
                )}
                {files.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {files.map((file) => (
                      <li
                        key={`${file.name}-${file.size}`}
                        className="flex items-center justify-between gap-2 rounded-md bg-surface-2 px-2.5 py-1.5 text-text"
                      >
                        <span className="min-w-0 truncate">{file.name}</span>
                        <span className="flex shrink-0 items-center gap-2 text-muted">
                          {formatSize(file.size)}
                          <button
                            type="button"
                            aria-label={t.removeFile}
                            onClick={() =>
                              setFiles((current) =>
                                current.filter((f) => f !== file),
                              )
                            }
                            className="-m-2 rounded p-2.5 transition hover:text-danger"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {/* Honeypot: off-screen and out of the tab order. A person never sees it; a script that fills every field does. */}
            <input
              name="hp_field"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            {SITE_KEY && canSend && (
              <Turnstile
                siteKey={SITE_KEY}
                resetKey={checkRound}
                onToken={(token) => {
                  checkToken.current = token;
                  setCheck("ready");
                }}
                onExpire={() => {
                  checkToken.current = null;
                  setCheck("pending");
                }}
                onUnavailable={() => setCheck("unavailable")}
              />
            )}

            {problems.length > 0 ? (
              <Notice key={`problems-${round}`} tone="danger" icon={<CircleAlert size={16} />} lifeMs={NOTICE_MS} onClose={() => setProblems([])}>
                <ul className="flex flex-col gap-0.5">
                  {problems.map((problem) => (
                    <li key={problem.field}>{problem.text}</li>
                  ))}
                </ul>
              </Notice>
            ) : status === "error" ? (
              <Notice key={`error-${round}`} tone="danger" icon={<CircleAlert size={16} />} lifeMs={NOTICE_MS} onClose={() => setStatus("idle")}>
                {t.error}{" "}
                <a href={`mailto:${profile.email}`} className="underline underline-offset-2 hover:text-accent">
                  {t.emailInstead}
                </a>
              </Notice>
            ) : status === "tooMany" ? (
              <Notice key={`toomany-${round}`} tone="info" icon={<Clock size={16} />} lifeMs={NOTICE_MS} onClose={() => setStatus("idle")}>
                {format(t.tooMany, { count: String(SERVER_LIMIT) })}{" "}
                <a href={`mailto:${profile.email}`} className="underline underline-offset-2 hover:text-accent">
                  {t.emailInstead}
                </a>
              </Notice>
            ) : waitText ? (
              <Notice
                key={`wait-${round}`}
                tone="info"
                icon={<Clock size={16} />}
                lifeMs={waitTotalMs}
                from={waitFrom}
                onClose={() => {
                  clearWait();
                  setStatus("idle");
                  setWaitMs(0);
                }}
              >
                {waitText}
              </Notice>
            ) : null}

            <button
              type="submit"
              disabled={status === "sending" || done || check === "pending"}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 font-mono text-sm font-medium text-bg transition hover:brightness-110 disabled:opacity-60 ${done ? "disabled:opacity-100" : ""}`}
            >
              {!done && (canSend ? <Send size={14} /> : <Mail size={14} />)}
              {status === "sending" ? <ScrambleText text={t.sending} /> : done ? <SentTick label={t.successTitle} /> : canSend ? t.send : t.mailSend}
            </button>
            {done && <CloseSoon onDone={close} />}
            {sentTimes.length > 0 && (
                // A small panel of its own, with one dot for each message of the hour (filled once used), so it reads as a status and not as one more rule.
                <p
                  className={`-mt-1 inline-flex items-center gap-2.5 self-center rounded-md border bg-surface-2 px-3 py-1.5 font-mono text-xs ${
                    sentTimes.length >= MAX_PER_WINDOW ? "border-accent/60 text-accent" : "border-border text-text"
                  }`}
                >
                  <span className="flex shrink-0 gap-1" aria-hidden="true">
                    {Array.from({ length: MAX_PER_WINDOW }, (_, i) => (
                      <i key={i} className={`h-2 w-2 rounded-full border ${i < sentTimes.length ? "border-accent bg-accent" : "border-muted/60"}`} />
                    ))}
                  </span>
                  <span className="text-left">
                    {sentTimes.length >= MAX_PER_WINDOW
                      ? format(t.sentAll, { count: String(MAX_PER_WINDOW), clock: formatClock([...sentTimes].sort((a, b) => a - b)[sentTimes.length - MAX_PER_WINDOW] + WINDOW_MS, bcp47) })
                      : format(t.sentCount, { sent: String(sentTimes.length), count: String(MAX_PER_WINDOW) })}
                  </span>
                </p>
              )}
          </form>
        </div>
      </CodeWindow>
      )}
    </ViewModal>
    {sentNotice &&
      createPortal(
        <Notice key={sentNotice.id} tone="success" icon={<CheckCircle2 size={16} />} lifeMs={NOTICE_MS} onClose={() => setSentNotice(null)}>
          <p className="font-semibold">{sentNotice.title}</p>
          <p className="mt-0.5 text-muted">{sentNotice.body}</p>
        </Notice>,
        document.body,
      )}
    </>
  );
}

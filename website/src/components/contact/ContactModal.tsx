import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, CircleAlert, Clock, Mail, Paperclip, Send, X } from "lucide-react";
import type { DragEvent, FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { borderBurst } from "@/hooks/borderGlitch";

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

/** After a message is sent the window closes itself this long after; a bar shows the time left. */
const AUTO_CLOSE_MS = 6000;
/** How long the window glitches before it closes. */
const GLITCH_MS = 450;

/** A plain check that an address has an @ and a dot after it; the mail service does the real one. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

/** How a post went: accepted, turned away for sending too much, refused for another
 * reason (the spam check, bad fields) or not answered at all (down, offline). */
type Outcome = "ok" | "limited" | "refused" | "failed";
/** `retryAfter` (seconds) comes with "limited" from the mail service, which says how long to wait. */
interface Result {
  outcome: Outcome;
  retryAfter?: number;
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

/** The countdown under the thank-you: a bar that runs down and the seconds left. When it
 * ends the window glitches, then `onDone` closes it. */
function AutoClose({ label, onDone }: { label: string; onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(Math.ceil(AUTO_CLOSE_MS / 1000));

  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const start = Date.now();
    const frame = window.requestAnimationFrame(() => setRunning(true));
    const tick = window.setInterval(() => setSeconds(Math.max(1, Math.ceil((AUTO_CLOSE_MS - (Date.now() - start)) / 1000))), 250);
    let closeTimer = 0;
    const end = window.setTimeout(() => {
      const win = rootRef.current?.closest<HTMLElement>(".glitch-border");
      if (win) borderBurst(win, 14);
      closeTimer = window.setTimeout(() => doneRef.current(), GLITCH_MS);
    }, AUTO_CLOSE_MS);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(tick);
      window.clearTimeout(end);
      window.clearTimeout(closeTimer);
    };
  }, []);

  return (
    <div ref={rootRef} className="mt-3 flex w-full flex-col items-center gap-2">
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2" role="presentation">
        <div
          className="h-full origin-left rounded-full bg-gradient-to-r from-accent to-accent-2"
          style={{ transform: running ? "scaleX(0)" : "scaleX(1)", transition: running ? `transform ${AUTO_CLOSE_MS}ms linear` : "none" }}
        />
      </div>
      <span className="font-mono text-xs text-muted">{format(label, { seconds: String(seconds) })}</span>
    </div>
  );
}

type Field = "name" | "email" | "message";

/** A message floating over the top of the contact window: what is wrong with the form,
 * why a send failed, or how long to wait. It has its own close button. */
function Notice({ tone, icon, onClose, closeLabel, children }: { tone: "danger" | "info"; icon: ReactNode; onClose: () => void; closeLabel: string; children: ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`notice-drop absolute inset-x-3 top-3 z-10 flex items-start gap-2.5 rounded-lg border bg-surface-2 py-2.5 pl-3 pr-1.5 font-mono text-xs shadow-xl shadow-black/40 ${tone === "danger" ? "border-danger/60 text-danger" : "border-accent/60 text-text"}`}
    >
      <span className={`mt-px shrink-0 ${tone === "danger" ? "" : "text-accent"}`}>{icon}</span>
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
      <button type="button" aria-label={closeLabel} onClick={onClose} className="-my-1 shrink-0 rounded p-2 text-muted transition hover:text-text">
        <X size={12} />
      </button>
    </div>
  );
}

type Status = "idle" | "sending" | "sent" | "mail" | "error" | "limited";

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
  // What is wrong with the fields after a send was tried: shown in a notice, and the fields get a red edge.
  const [problems, setProblems] = useState<{ field: Field; text: string }[]>([]);
  const checked = canSend && Boolean(SITE_KEY);
  // The spam check's token: fetched in the background, so the form can only be sent once it is there.
  const checkToken = useRef<string | null>(null);
  const [check, setCheck] = useState<"pending" | "ready" | "unavailable">(checked ? "pending" : "ready");
  const [checkRound, setCheckRound] = useState(0);

  useEffect(() => {
    const onOpen = () => {
      setStatus("idle");
      setFiles([]);
      setFileError(false);
      setProblems([]);
      checkToken.current = null;
      setCheck(checked ? "pending" : "ready");
      openedAt.current = Date.now();
      setOpen(true);
    };
    window.addEventListener(OPEN_CONTACT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONTACT_EVENT, onOpen);
  }, [checked]);

  useEffect(() => {
    if (status !== "limited") return;
    const id = window.setInterval(() => setWaitMs((left) => left - 1000), 1000);
    return () => window.clearInterval(id);
  }, [status]);


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
    if (found.length > 0) {
      setStatus("idle");
      (formElement.elements.namedItem(found[0].field) as HTMLElement | null)?.focus();
      return;
    }
    const now = Date.now();
    const sends = recentSends(now);
    // How long until the form may be sent: the longest of the waits that apply.
    const waits: number[] = [];
    if (now - openedAt.current < MIN_FILL_MS) waits.push(MIN_FILL_MS - (now - openedAt.current));
    if (sends.length > 0 && now - Math.max(...sends) < MIN_GAP_MS) waits.push(MIN_GAP_MS - (now - Math.max(...sends)));
    if (sends.length >= MAX_PER_WINDOW) waits.push([...sends].sort((a, b) => a - b)[sends.length - MAX_PER_WINDOW] + WINDOW_MS - now);
    if (waits.length > 0) {
      setWaitMs(Math.max(...waits));
      setStatus("limited");
      return;
    }
    if (!ENDPOINT) {
      // No form service behind this site: the visitor's own email app sends it.
      const body = `${message}\n\n— ${name} <${email}>`;
      const clipped = body.length > MAILTO_BODY_MAX ? `${body.slice(0, MAILTO_BODY_MAX)}…` : body;
      rememberSend(now);
      setStatus("mail");
      window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(`Portfolio - ${name} sent you a message`)}&body=${encodeURIComponent(clipped)}`;
      return;
    }

    setStatus("sending");
    const fields = { name, email, message };
    let { outcome, retryAfter } = await deliver(ENDPOINT, ACCESS_KEY, fields, canAttach ? files : [], checkToken.current);
    // Only a mail service that is down hands over to the backup. A refusal (spam check, too many messages) is final, or the backup would let spam around it.
    if (outcome === "failed" && FALLBACK_ENDPOINT) ({ outcome, retryAfter } = await deliver(FALLBACK_ENDPOINT, ACCESS_KEY, fields, [], null));
    if (outcome === "ok") rememberSend(Date.now());
    // The mail service says how long to wait; without that, a minute.
    if (outcome === "limited") setWaitMs((retryAfter ?? 60) * 1000);
    setStatus(outcome === "ok" ? "sent" : outcome === "limited" ? "limited" : "error");
    if (outcome !== "ok" && checked) {
      // A token works once: ask for a new one before the next try.
      checkToken.current = null;
      setCheck("pending");
      setCheckRound((round) => round + 1);
    }
  }

  const done = status === "sent" || status === "mail";
  const waitText = status === "limited" && waitMs > 0 ? format(t.rateLimited, { time: formatWait(Math.max(1, Math.ceil(waitMs / 1000)), getLocaleMeta(locale).bcp47) }) : null;
  const fieldClass = (field: Field, extra = "") => `${FIELD} ${extra} ${problems.some((p) => p.field === field) ? "border-danger!" : ""}`;

  return (
    <ViewModal open={open} widthClass="max-w-md" onClose={() => setOpen(false)}>
      {(close) => (
      <CodeWindow
        filename="message.txt"
        className="flex min-h-0 flex-col"
        onClose={close}
      >
        <div className="relative flex min-h-0 flex-1 flex-col">
        {!done &&
          (problems.length > 0 ? (
            <Notice tone="danger" icon={<CircleAlert size={16} />} closeLabel={t.close} onClose={() => setProblems([])}>
              <ul className="flex flex-col gap-0.5">
                {problems.map((problem) => (
                  <li key={problem.field}>{problem.text}</li>
                ))}
              </ul>
            </Notice>
          ) : status === "error" ? (
            <Notice tone="danger" icon={<CircleAlert size={16} />} closeLabel={t.close} onClose={() => setStatus("idle")}>
              {t.error}{" "}
              <a href={`mailto:${profile.email}`} className="underline underline-offset-2 hover:text-accent">
                {t.emailInstead}
              </a>
            </Notice>
          ) : waitText ? (
            <Notice tone="info" icon={<Clock size={16} />} closeLabel={t.close} onClose={() => setWaitMs(0)}>
              {waitText}
            </Notice>
          ) : null)}
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              {status === "mail" ? (
                <Mail size={40} className="text-accent" />
              ) : (
                <CheckCircle2 size={40} className="text-accent" />
              )}
              <Dialog.Title className="text-xl font-bold text-text">
                {status === "mail" ? t.mailTitle : t.successTitle}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted">
                {status === "mail" ? format(t.mailBody, { email: profile.email }) : t.successBody}
              </Dialog.Description>
              <AutoClose label={t.closingIn} onDone={close} />
            </div>
          ) : (
            <form
              noValidate
              onSubmit={handleSubmit}
              onInput={(event) => {
                const field = (event.target as HTMLInputElement).name;
                setProblems((list) => list.filter((problem) => problem.field !== field));
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
              </div>

              <label className="flex flex-col gap-1.5 font-mono text-xs text-muted">
                {t.nameLabel}
                <input
                  name="name"
                  required
                  maxLength={100}
                  autoComplete="name"
                  aria-invalid={problems.some((p) => p.field === "name")}
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
                  aria-invalid={problems.some((p) => p.field === "email")}
                  className={fieldClass("email")}
                />
              </label>
              <label className="flex flex-col gap-1.5 font-mono text-xs text-muted">
                {t.messageLabel}
                <textarea
                  name="message"
                  required
                  rows={5}
                  maxLength={4000}
                  aria-invalid={problems.some((p) => p.field === "message")}
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

              <button
                type="submit"
                disabled={status === "sending" || check === "pending"}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 font-mono text-sm font-medium text-bg transition hover:brightness-110 disabled:opacity-60"
              >
                {canSend ? <Send size={14} /> : <Mail size={14} />}
                {status === "sending" ? t.sending : canSend ? t.send : t.mailSend}
              </button>
            </form>
          )}
        </div>
        </div>
      </CodeWindow>
      )}
    </ViewModal>
  );
}

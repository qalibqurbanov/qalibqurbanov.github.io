import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, Mail, Paperclip, Send, X } from "lucide-react";
import type { DragEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { CodeWindow } from "@/components/ui/CodeWindow";
import { ViewModal } from "@/components/ui/ViewModal";
import { useContent } from "@/i18n/context";
import { OPEN_CONTACT_EVENT } from "@/components/contact/openContact";
import { format } from "@/lib/format";

/** Where the form is delivered. Set `VITE_CONTACT_ENDPOINT` to a form-relay
 * URL (Formspree, Web3Forms…); `VITE_CONTACT_ACCESS_KEY` is forwarded as
 * `access_key` for services that want one. Without an endpoint the form does
 * not pretend: it hands the message to the visitor's own email app. */
const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;
const ACCESS_KEY = import.meta.env.VITE_CONTACT_ACCESS_KEY as
  string | undefined;

/** Attachments need a plan that accepts files (the free tiers of the usual services do not): they are only offered when this is switched on. */
const ATTACHMENTS = import.meta.env.VITE_CONTACT_ATTACHMENTS === "true";

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

type Status = "idle" | "sending" | "sent" | "mail" | "error" | "limited";

const FIELD =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-2 font-sans text-sm text-text placeholder:text-muted/60 outline-none transition focus:border-accent selectable";

export function ContactModal() {
  const { profile, ui } = useContent();
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

  useEffect(() => {
    const onOpen = () => {
      setStatus("idle");
      setFiles([]);
      setFileError(false);
      openedAt.current = Date.now();
      setOpen(true);
    };
    window.addEventListener(OPEN_CONTACT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONTACT_EVENT, onOpen);
  }, []);

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
    const form = new FormData(event.currentTarget);
    // Honeypot: real users never see or fill this field.
    if (form.get("hp_field")) return;
    const now = Date.now();
    const sends = recentSends(now);
    if (now - openedAt.current < MIN_FILL_MS || sends.length >= MAX_PER_WINDOW || (sends.length > 0 && now - Math.max(...sends) < MIN_GAP_MS)) {
      setStatus("limited");
      return;
    }
    const name = String(form.get("name") ?? "");
    const message = String(form.get("message") ?? "");
    const email = String(form.get("email") ?? "");

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
    try {
      // Multipart, so attachments can ride along with the text fields.
      const body = new FormData();
      if (ACCESS_KEY) body.append("access_key", ACCESS_KEY);
      body.append("name", name);
      body.append("email", email);
      body.append("message", message);
      body.append("subject", `Portfolio - ${name} sent you a message`);
      body.append("page", window.location.href);
      if (canAttach) for (const file of files) body.append("attachment", file, file.name);
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      // The services answer with JSON that says whether they accepted the message (Web3Forms: `success`, Formspree: `ok`).
      const reply: unknown = await response.json().catch(() => null);
      const refused = typeof reply === "object" && reply !== null && ("success" in reply ? reply.success === false : "ok" in reply ? reply.ok === false : false);
      const accepted = response.ok && !refused;
      if (accepted) rememberSend(Date.now());
      setStatus(accepted ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  const done = status === "sent" || status === "mail";

  return (
    <ViewModal open={open} widthClass="max-w-md" onClose={() => setOpen(false)}>
      <CodeWindow
        filename="message.txt"
        className="flex min-h-0 flex-col"
        onClose={() => setOpen(false)}
      >
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
              <Dialog.Close className="mt-2 min-h-11 rounded-md border border-border px-5 py-2 font-mono text-sm text-text transition hover:border-accent hover:text-accent">
                {t.close}
              </Dialog.Close>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  className={FIELD}
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
                  className={FIELD}
                />
              </label>
              <label className="flex flex-col gap-1.5 font-mono text-xs text-muted">
                {t.messageLabel}
                <textarea
                  name="message"
                  required
                  rows={5}
                  maxLength={4000}
                  className={`${FIELD} custom-scrollbar [--scrollbar-track:var(--color-surface-2)] resize-none`}
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

              {(status === "error" || status === "limited") && (
                <p role="alert" className="font-mono text-xs text-danger">
                  {status === "limited" ? t.rateLimited : t.error}
                  {status === "error" && (
                    <>
                      {" "}
                      <a
                        href={`mailto:${profile.email}`}
                        className="underline underline-offset-2 hover:text-accent"
                      >
                        {t.emailInstead}
                      </a>
                    </>
                  )}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 font-mono text-sm font-medium text-bg transition hover:brightness-110 disabled:opacity-60"
              >
                {canSend ? <Send size={14} /> : <Mail size={14} />}
                {status === "sending" ? t.sending : canSend ? t.send : t.mailSend}
              </button>
            </form>
          )}
        </div>
      </CodeWindow>
    </ViewModal>
  );
}

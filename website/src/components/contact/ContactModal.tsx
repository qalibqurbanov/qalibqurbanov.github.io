import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, Paperclip, Send, X } from "lucide-react";
import type { DragEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { CodeWindow } from "@/components/ui/CodeWindow";
import { ViewModal } from "@/components/ui/ViewModal";
import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";

export const OPEN_CONTACT_EVENT = "open-contact-modal";

export function openContactModal() {
  window.dispatchEvent(new Event(OPEN_CONTACT_EVENT));
}

/** Where the form is delivered. Set `VITE_CONTACT_ENDPOINT` to a form-relay
 * URL (Formspree, Web3Forms…); `VITE_CONTACT_ACCESS_KEY` is forwarded as
 * `access_key` for services that want one. */
const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;
const ACCESS_KEY = import.meta.env.VITE_CONTACT_ACCESS_KEY as
  string | undefined;

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Status = "idle" | "sending" | "sent" | "error";

const FIELD =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-2 font-sans text-sm text-text placeholder:text-muted/60 outline-none transition focus:border-accent selectable";

export function ContactModal() {
  const { ui } = useContent();
  const t = ui.contactModal;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = () => {
      setStatus("idle");
      setFiles([]);
      setFileError(false);
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
    if (form.get("website")) return;
    if (!ENDPOINT) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      // Multipart, so attachments can ride along with the text fields.
      const body = new FormData();
      if (ACCESS_KEY) body.append("access_key", ACCESS_KEY);
      body.append("name", String(form.get("name") ?? ""));
      body.append("email", String(form.get("email") ?? ""));
      body.append("message", String(form.get("message") ?? ""));
      body.append(
        "subject",
        `Portfolio message from ${String(form.get("name") ?? "")}`,
      );
      body.append("page", window.location.href);
      for (const file of files) body.append("attachment", file, file.name);
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      setStatus(response.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <ViewModal open={open} widthClass="max-w-md" onClose={() => setOpen(false)}>
      <CodeWindow
        filename="message.txt"
        className="flex min-h-0 flex-col"
        onClose={() => setOpen(false)}
      >
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6">
          {status === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 size={40} className="text-accent" />
              <Dialog.Title className="text-xl font-bold text-text">
                {t.successTitle}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted">
                {t.successBody}
              </Dialog.Description>
              <Dialog.Close className="mt-2 rounded-md border border-border px-5 py-2 font-mono text-sm text-text transition hover:border-accent hover:text-accent">
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
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-4 text-center transition ${
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
                            className="rounded p-0.5 transition hover:text-danger"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              {status === "error" && (
                <p role="alert" className="font-mono text-xs text-danger">
                  {t.error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 font-mono text-sm font-medium text-bg transition hover:brightness-110 disabled:opacity-60"
              >
                <Send size={14} />
                {status === "sending" ? t.sending : t.send}
              </button>
            </form>
          )}
        </div>
      </CodeWindow>
    </ViewModal>
  );
}

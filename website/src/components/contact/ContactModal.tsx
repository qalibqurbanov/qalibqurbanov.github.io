import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, Send, X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { useContent } from "@/i18n/context";

export const OPEN_CONTACT_EVENT = "open-contact-modal";

export function openContactModal() {
  window.dispatchEvent(new Event(OPEN_CONTACT_EVENT));
}

/** Where the form is delivered. Set `VITE_CONTACT_ENDPOINT` to a form-relay
 * URL (Formspree, Web3Forms…); `VITE_CONTACT_ACCESS_KEY` is forwarded as
 * `access_key` for services that want one. */
const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;
const ACCESS_KEY = import.meta.env.VITE_CONTACT_ACCESS_KEY as string | undefined;

type Status = "idle" | "sending" | "sent" | "error";

const FIELD =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-text placeholder:text-muted/60 outline-none transition focus:border-accent selectable";

export function ContactModal() {
  const { ui } = useContent();
  const t = ui.contactModal;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const onOpen = () => {
      setStatus("idle");
      setOpen(true);
    };
    window.addEventListener(OPEN_CONTACT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONTACT_EVENT, onOpen);
  }, []);

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
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...(ACCESS_KEY ? { access_key: ACCESS_KEY } : {}),
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
          subject: `Portfolio message from ${String(form.get("name") ?? "")}`,
          page: window.location.href,
        }),
      });
      setStatus(response.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm command-dialog-overlay" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-2xl shadow-black/40 command-dialog-content">
          <Dialog.Close
            aria-label={t.close}
            className="absolute right-3 top-3 rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-text"
          >
            <X size={16} />
          </Dialog.Close>

          {status === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 size={40} className="text-accent" />
              <Dialog.Title className="text-xl font-bold text-text">{t.successTitle}</Dialog.Title>
              <Dialog.Description className="text-sm text-muted">{t.successBody}</Dialog.Description>
              <Dialog.Close className="mt-2 rounded-md border border-border px-5 py-2 font-mono text-sm text-text transition hover:border-accent hover:text-accent">
                {t.close}
              </Dialog.Close>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Dialog.Title className="text-xl font-bold text-text">{t.title}</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted">{t.description}</Dialog.Description>
              </div>

              <label className="flex flex-col gap-1.5 font-mono text-xs text-muted">
                {t.nameLabel}
                <input name="name" required maxLength={100} autoComplete="name" className={FIELD} />
              </label>
              <label className="flex flex-col gap-1.5 font-mono text-xs text-muted">
                {t.emailLabel}
                <input name="email" type="email" required maxLength={200} autoComplete="email" className={FIELD} />
              </label>
              <label className="flex flex-col gap-1.5 font-mono text-xs text-muted">
                {t.messageLabel}
                <textarea name="message" required rows={5} maxLength={4000} className={`${FIELD} resize-none`} />
              </label>
              <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

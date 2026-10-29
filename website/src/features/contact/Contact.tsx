import { Check, Copy, Send } from "lucide-react";

import { openContactModal } from "@/components/contact/openContact";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionClosing } from "@/components/ui/SectionClosing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";

import { useCopy } from "./clipboard";

export function Contact() {
  const { profile, ui } = useContent();
  const { copied, copy } = useCopy(profile.email);

  return (
    <section id="contact" className="py-28">
      <Container>
        <SectionHeading id="contact" index={ui.sections.contact.index} title={ui.sections.contact.title} />

        <Reveal className="card-surface rounded-xl">
          <div className="flex flex-col items-start gap-6 px-6 py-8 sm:px-10 md:flex-row md:items-center md:justify-between">
            <div className="flex max-w-xl flex-col gap-3">
              <p className="flex items-center gap-2.5 font-mono text-xs text-syn-number">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-syn-number opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-syn-number" />
                </span>
                {ui.contact.status}
              </p>
              <h3 className="font-display text-3xl font-bold leading-tight text-text sm:text-4xl">
                {ui.contact.headlineLead} <span className="text-gradient">{ui.contact.headlineAccent}</span>
              </h3>
              <p className="leading-relaxed text-muted">{ui.contact.body}</p>
              <ul className="flex flex-wrap gap-1.5">
                {ui.contact.openTo.map((kind) => (
                  <li key={kind} className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] text-text">
                    {kind}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 md:w-auto">
              <button
                type="button"
                onClick={openContactModal}
                className="btn-pulse btn-solid inline-flex items-center justify-center gap-2.5 rounded-md bg-gradient-to-br from-accent to-[#8b5cf6] px-5 py-3 font-mono text-sm font-semibold text-bg transition hover:brightness-110"
              >
                <Send size={16} /> {ui.contact.send}
              </button>
              <button
                type="button"
                onClick={copy}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-2.5 py-2 font-mono text-xs transition ${
                  copied ? "border-syn-number text-syn-number" : "border-border text-muted hover:border-accent hover:text-text"
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span aria-live="polite">{copied ? ui.contact.copied : ui.contact.copy}</span>
              </button>
            </div>
          </div>
        </Reveal>

        <SectionClosing />
      </Container>
    </section>
  );
}

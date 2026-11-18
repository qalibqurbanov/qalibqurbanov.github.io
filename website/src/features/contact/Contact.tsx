import { ArrowUpRight, Check, Copy, Download } from "lucide-react";

import { openContactModal } from "@/components/contact/openContact";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/SectionHeading";
import { resumeHref } from "@/hooks/useProjectRoute";
import { useContent } from "@/i18n/context";

import { useCopy } from "./clipboard";

/** The close: a short invitation, then the ways to start — write a message, copy the address, open the résumé. */
export function Contact() {
  const { profile, ui } = useContent();
  const { copied, copy } = useCopy(profile.email);
  const hasResume = profile.resumeUrl && profile.resumeUrl !== "#";

  return (
    <Section id="contact" title={ui.sections.contact.title}>
      <Reveal>
        <h3 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          {ui.contact.headlineLead} <span className="text-accent">{ui.contact.headlineAccent}</span>
        </h3>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{ui.contact.body}</p>

        <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-2 text-accent">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent-2" aria-hidden="true" />
            {ui.contact.status}
          </span>
          {ui.contact.openTo.map((kind) => (
            <span key={kind} className="text-muted">
              {kind}
            </span>
          ))}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={openContactModal} className="btn-solid inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 text-sm font-medium">
            {ui.contact.send}
            <ArrowUpRight size={15} />
          </button>
          {hasResume && (
            <a href={resumeHref("contact")} className="btn-line inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium">
              <Download size={15} />
              {ui.labels.resume}
            </a>
          )}
          <button type="button" onClick={copy} className="btn-line inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 font-mono text-xs">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span aria-live="polite">{copied ? ui.contact.copied : profile.email}</span>
          </button>
        </div>
      </Reveal>
    </Section>
  );
}

import { Check, Copy, FileText, Send } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

import { openContactModal } from "@/components/contact/openContact";
import { renderEmphasis } from "@/components/ui/emphasis";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/SectionHeading";
import { resumeHref } from "@/hooks/useProjectRoute";
import { useContent } from "@/i18n/context";

import { useCopy } from "./clipboard";

/** The headline on one line: sized by the window and, if a language makes it wider than its box, made just small enough to fit. */
function FitHeadline({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const line = ref.current;
    const box = line?.parentElement;
    if (!line || !box) return;
    const fit = () => {
      line.style.removeProperty("--fit");
      const range = document.createRange();
      range.selectNodeContents(line);
      const width = range.getBoundingClientRect().width;
      if (width > box.clientWidth) line.style.setProperty("--fit", `${((parseFloat(getComputedStyle(line).fontSize) * box.clientWidth) / width * 0.98).toFixed(2)}px`);
    };
    fit();
    void document.fonts.ready.then(fit);
    const watcher = new ResizeObserver(fit);
    watcher.observe(box);
    return () => watcher.disconnect();
  }, [text]);
  // The room under the line (padding) keeps the gradient clip from cutting the tails of letters like "g".
  return (
    <h3 ref={ref} className="contact-grad mt-4 w-fit whitespace-nowrap pb-[0.14em] font-display font-semibold leading-[1.18] tracking-tight" style={{ fontSize: "min(clamp(1.7rem, 4.6vw, 3.6rem), var(--fit, 99rem))" }}>
      {text}
    </h3>
  );
}

/** The close: a headline with what I am open to, then the ways to reach me as big rows (write here, copy the address, read the
 * résumé), each one a line of display type that wipes with colour when pointed at. */
export function Contact() {
  const { profile, ui } = useContent();
  const c = ui.contact;
  const { copied, copy } = useCopy(profile.email);
  const hasResume = profile.resumeUrl && profile.resumeUrl !== "#";

  const rows = [
    { n: "01", icon: <Send size={20} />, title: c.send, note: c.writeNote, onClick: openContactModal },
    { n: "02", icon: copied ? <Check size={20} /> : <Copy size={20} />, title: copied ? c.copied : c.copy, note: profile.email, onClick: copy },
    ...(hasResume ? [{ n: "03", icon: <FileText size={20} />, title: ui.labels.resume, note: c.resumeNote, href: resumeHref("contact") }] : []),
  ];

  return (
    <Section id="contact" title={ui.sections.contact.title}>
      <Reveal>
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-accent">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent-2" aria-hidden="true" />
              {c.status}
            </span>
            <span className="inline-flex items-center divide-x divide-border rounded-full border border-border text-sm text-accent">
              {c.openTo.map((kind) => (
                <span key={kind} className="px-4 py-1.5">
                  {kind}
                </span>
              ))}
            </span>
          </div>
          <FitHeadline text={`${c.headlineLead} ${c.headlineAccent}`} />
          <p className="contact-body mt-3 text-balance text-lg leading-relaxed text-muted">{renderEmphasis(c.body)}</p>

          <div className="mt-7 border-t border-border">
            {rows.map((row) => {
              const inner = (
                <>
                  <span className="contact-row-icon" aria-hidden="true">
                    {row.icon}
                  </span>
                  <span className="contact-row-title font-display">
                    <span className="contact-row-star font-normal text-accent-2" aria-hidden="true">
                      ✦
                    </span>
                    {row.title}
                  </span>
                  <span className="contact-row-note">
                    <span aria-hidden="true" className="contact-row-dash" />
                    {row.note}
                  </span>
                </>
              );
              return "href" in row ? (
                <a key={row.n} href={row.href} className="contact-row">
                  {inner}
                </a>
              ) : (
                <button key={row.n} type="button" onClick={row.onClick} className="contact-row" aria-live="polite">
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

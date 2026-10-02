import type { ReactNode } from "react";

import avatarUrl from "@/assets/avatar.png";
import { Container } from "@/components/ui/Container";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { SectionClosing } from "@/components/ui/SectionClosing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";

/**
 * Inline markup for About paragraphs: `**text**` renders as bright bold
 * display-font text (stats/achievements), `==text==` as an accent-colored
 * monospace "inline code" chip (tech/skill terms).
 */
function renderEmphasis(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|==[^=]+==)/g).filter(Boolean);
  if (parts.length === 1) return parts[0];

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-display text-text font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("==") && part.endsWith("==")) {
      return (
        <code
          key={index}
          className="font-mono text-[0.88em] font-medium text-accent bg-accent/10 border border-accent/20 rounded-md px-1.5 py-0.5 [box-decoration-break:clone]"
        >
          {part.slice(2, -2)}
        </code>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function About() {
  const { about, profile, ui } = useContent();

  return (
    <section id="about" className="py-28">
      <Container>
        <SectionHeading id="about" index={ui.sections.about.index} title={ui.sections.about.title} />

        <div className="space-y-10">
          <Reveal className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6">
            <div className="card-surface w-32 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src={avatarUrl}
                alt={profile.name}
                className="w-32 h-32 object-cover"
                width={128}
                height={128}
              />
            </div>
            <dl className="card-surface rounded-xl p-5 flex-1 flex flex-wrap gap-x-8 gap-y-4">
              {about.highlights.map((highlight) => (
                <div key={highlight.label}>
                  <dt className="font-mono text-xs text-accent uppercase tracking-wide">
                    <span className="text-muted">{"> "}</span>
                    {highlight.label}
                  </dt>
                  <dd className="font-display text-text text-lg font-bold mt-0.5">
                    <CountUp value={highlight.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delayMs={150} className="space-y-5 text-muted leading-relaxed">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{renderEmphasis(paragraph)}</p>
            ))}
          </Reveal>
        </div>

        <SectionClosing />
      </Container>
    </section>
  );
}

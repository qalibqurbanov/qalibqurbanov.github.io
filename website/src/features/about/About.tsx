import type { ReactNode } from "react";

import avatarUrl from "@/assets/avatar.png";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionClosing } from "@/components/ui/SectionClosing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";

/**
 * Inline markup for About paragraphs: `**text**` renders as a bright bold
 * span (stats/achievements), `==text==` as a bold accent-colored span
 * (tech/skill terms).
 */
function renderEmphasis(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|==[^=]+==)/g).filter(Boolean);
  if (parts.length === 1) return parts[0];

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="text-text font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("==") && part.endsWith("==")) {
      return (
        <strong key={index} className="text-accent font-semibold">
          {part.slice(2, -2)}
        </strong>
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
        <SectionHeading index={ui.sections.about.index} title={ui.sections.about.title} />

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
                  <dd className="text-text mt-0.5">{highlight.value}</dd>
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

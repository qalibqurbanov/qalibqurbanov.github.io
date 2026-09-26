import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionClosing } from "@/components/ui/SectionClosing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";

export function About() {
  const { about, profile, ui } = useContent();

  return (
    <section id="about" className="py-28">
      <Container>
        <SectionHeading index={ui.sections.about.index} title={ui.sections.about.title} />

        <div className="grid md:grid-cols-3 gap-12">
          <Reveal className="md:col-span-2 space-y-5 text-muted leading-relaxed">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Reveal>

          <Reveal delayMs={150} className="space-y-6">
            <div className="card-surface w-40 h-40 rounded-2xl flex items-center justify-center mx-auto md:mx-0">
              <span className="font-mono text-4xl text-gradient font-semibold">
                {profile.avatarInitials}
              </span>
            </div>
            <dl className="card-surface rounded-xl p-5 space-y-4">
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
        </div>

        <SectionClosing />
      </Container>
    </section>
  );
}

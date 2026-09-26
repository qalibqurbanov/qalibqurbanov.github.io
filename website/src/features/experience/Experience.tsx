import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionClosing } from "@/components/ui/SectionClosing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Tag } from "@/components/ui/Tag";
import { useContent } from "@/i18n/context";

export function Experience() {
  const { experience, ui } = useContent();

  return (
    <section id="experience" className="py-28">
      <Container>
        <SectionHeading
          index={ui.sections.experience.index}
          title={ui.sections.experience.title}
        />

        <ol className="relative border-l border-border ml-2">
          {experience.map((item, index) => (
            <li key={item.role} className="mb-12 ml-8 last:mb-0">
              <span className="absolute -left-[7px] mt-1.5 w-3.5 h-3.5 rounded-full bg-accent ring-4 ring-bg shadow-[0_0_0_3px_var(--glow-accent)]" />
              <Reveal delayMs={index * 100}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold text-text">
                    {item.role} <span className="text-muted">· {item.org}</span>
                  </h3>
                  <span className="font-mono text-xs text-accent whitespace-nowrap bg-surface-2 border border-border rounded-md px-2 py-0.5">
                    {item.period}
                  </span>
                </div>
                <p className="text-muted mt-2 leading-relaxed">{item.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        <SectionClosing />
      </Container>
    </section>
  );
}

import { Fragment } from "react";

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
          id="experience"
          index={ui.sections.experience.index}
          title={ui.sections.experience.title}
        />

        <ol className="relative border-l border-border ml-2">
          {experience.map((item, index) => {
            return (
              <li key={item.role} className="mb-12 ml-8 last:mb-0">
                <span className="absolute -left-[7px] mt-1.5 flex w-3.5 h-3.5" aria-hidden="true">
                  {item.current && (
                    <span className="absolute inline-flex w-full h-full rounded-full bg-accent opacity-75 animate-ping" />
                  )}
                  <span className="relative inline-flex w-3.5 h-3.5 rounded-full bg-accent ring-4 ring-bg shadow-[0_0_0_3px_var(--glow-accent)]" />
                </span>
                <Reveal delayMs={index * 100}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-semibold text-text">
                      {item.role} <span className="text-muted">· {item.org}</span>
                    </h3>
                    <span className="font-mono text-xs text-accent whitespace-nowrap bg-surface-2 border border-border rounded-md px-2 py-0.5">
                      {/* The ∞ glyph's thin loop reads much smaller than digits
                          at the same font-size, so bump just that character
                          up rather than the whole (otherwise-tiny) badge. */}
                      {item.period.split("∞").map((part, partIndex, parts) => (
                        <Fragment key={partIndex}>
                          {part}
                          {partIndex < parts.length - 1 && (
                            <span className="text-base font-bold leading-none align-[-2px]">∞</span>
                          )}
                        </Fragment>
                      ))}
                    </span>
                  </div>
                  <p className="text-muted mt-2 leading-relaxed">{item.description}</p>
                  {item.projects && item.projects.length > 0 && (
                    <>
                      {item.projectsIntro && (
                        <p className="text-muted mt-3 leading-relaxed">{item.projectsIntro}</p>
                      )}
                      <ul className="mt-2 list-disc list-inside space-y-1 text-muted">
                        {item.projects.map((project) => (
                          <li key={project.url}>
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent hover:underline"
                            >
                              {project.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {item.highlights && item.highlights.length > 0 && (
                    <>
                      {item.highlightsIntro && (
                        <p className="text-muted mt-3 leading-relaxed">{item.highlightsIntro}</p>
                      )}
                      <ul className="mt-2 list-disc list-inside space-y-1 text-muted">
                        {item.highlights.map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>

        <SectionClosing />
      </Container>
    </section>
  );
}

import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/SectionHeading";
import { useClock } from "@/hooks/useClock";
import { useContent, useLocale } from "@/i18n/context";
import { formatDuration } from "@/lib/duration";
import type { ExperienceItem, ExperienceLink } from "@/types/content";

function hostOf(link: ExperienceLink): string {
  try {
    return new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    return link.url;
  }
}

/** A public project of the role, as one ruled row: logo, name, what it is. */
function ProjectLink({ link }: { link: ExperienceLink }) {
  return (
    <a href={link.url} target="_blank" rel="noreferrer" className="entry group flex items-center gap-3 border-t border-border py-2.5 first:border-t-0">
      {link.logo ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-white p-1">
          <img src={link.logo} alt="" width={24} height={24} className="h-full w-full object-contain" />
        </span>
      ) : (
        <span className="h-8 w-8 shrink-0 rounded border border-border" aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1">
        <span className="entry-title block truncate text-sm font-medium transition-colors">{link.label}</span>
        <span className="block truncate text-xs text-muted">{link.description ?? hostOf(link)}</span>
      </span>
      <ArrowUpRight size={15} className="shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
    </a>
  );
}

function Job({ item }: { item: ExperienceItem }) {
  const { ui } = useContent();
  const { locale } = useLocale();

  return (
    <Reveal className="grid gap-x-8 gap-y-3 border-t border-border py-7 first:border-t-0 first:pt-0 md:grid-cols-[11rem_1fr]">
      <div>
        <p className="font-mono text-xs text-muted">{item.period}</p>
        <p className="mt-1 font-mono text-xs text-accent">{formatDuration(item.start, item.end, locale)}</p>
      </div>

      <div className="min-w-0 space-y-5">
        <div className="flex items-center gap-3">
          {item.logo && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-white p-1.5">
              <img src={item.logo} alt="" width={28} height={28} className="h-full w-full object-contain" />
            </span>
          )}
          <div>
            <h3 className="text-base font-semibold leading-snug">{item.role}</h3>
            <p className="flex items-center gap-2 text-sm text-muted">
              {item.org}
              {item.current && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-accent-2">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent-2" aria-hidden="true" />
                  {ui.experienceLabels.now}
                </span>
              )}
            </p>
          </div>
        </div>

        <p className="text-[15px] leading-relaxed text-muted">{item.description}</p>

        {item.highlights && item.highlights.length > 0 && (
          <ul className="space-y-2">
            {item.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-3 text-sm leading-snug text-muted">
                <span className="mt-[0.5rem] h-px w-3 shrink-0 bg-accent" aria-hidden="true" />
                {highlight}
              </li>
            ))}
          </ul>
        )}

        {item.projects && item.projects.length > 0 && (
          <div>
            <p className="label mb-1.5">{ui.experienceLabels.publicProjects}</p>
            <div className="rounded-lg border border-border bg-surface px-4">
              {item.projects.map((project) => (
                <ProjectLink key={project.url} link={project} />
              ))}
            </div>
          </div>
        )}

        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="label mr-1">{ui.experienceLabels.stack}</span>
          {item.tags.map((tag, index) => (
            <span key={tag} className="font-mono text-xs text-muted">
              {tag}
              {index < item.tags.length - 1 ? "," : ""}
            </span>
          ))}
        </p>
      </div>
    </Reveal>
  );
}

export function Experience() {
  const { experience, ui } = useContent();
  useClock(); // so an ongoing job's length rolls over at the turn of a month, even in a tab left open

  return (
    <Section id="experience" title={ui.sections.experience.title}>
      <div>
        {experience.map((item) => (
          <Job key={`${item.org}-${item.role}`} item={item} />
        ))}
      </div>
    </Section>
  );
}

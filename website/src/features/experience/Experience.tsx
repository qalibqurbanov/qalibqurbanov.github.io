import { ArrowUpRight, Infinity } from "lucide-react";

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

/** "2023-12" as "Dec 2023" (the month in the language of the page). */
const MONTHS: Record<string, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  az: ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"],
  ru: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
};

function monthYear(value: string, locale: string): string {
  const [year, month] = value.split("-").map(Number);
  return `${(MONTHS[locale] ?? MONTHS.en)[month - 1]} ${year}`;
}

function Job({ item }: { item: ExperienceItem }) {
  const { ui } = useContent();
  const { locale } = useLocale();

  return (
    <Reveal className="grid gap-x-8 gap-y-3 border-t border-border py-7 first:border-t-0 first:pt-0 md:grid-cols-[11rem_1fr]">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {item.logo && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-white p-1.5">
              <img src={item.logo} alt="" width={28} height={28} className="h-full w-full object-contain" />
            </span>
          )}
          <div>
            <p className="text-sm font-semibold leading-snug">{item.org}</p>
            <h3 className="text-sm leading-snug text-muted">{item.role}</h3>
          </div>
        </div>
        <div>
          <p className="flex flex-wrap items-center gap-x-1.5 font-mono text-xs leading-5 text-muted">
            <span className="sr-only">{item.period}</span>
            <span aria-hidden="true">{monthYear(item.start, locale)} —</span>
            <span aria-hidden="true" className="flex h-5 items-center">
              {item.end ? monthYear(item.end, locale) : <Infinity size={18} strokeWidth={2.4} className="text-text" />}
            </span>
            <span className="text-accent">({formatDuration(item.start, item.end, locale)})</span>
          </p>
        </div>
        {item.current && (
          <span className="inline-flex h-[26px] items-center rounded-full border border-accent-2/40 bg-accent-2/10 gap-1 pl-2.5 pr-3.5 font-mono text-xs leading-none text-accent-2">
            <span className="now-dot" aria-hidden="true">
              <span className="now-dot-ring" />
              <span className="now-dot-core" />
            </span>
            {ui.experienceLabels.now}
          </span>
        )}
      </div>

      <div className="min-w-0 space-y-5">
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

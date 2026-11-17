import { ArrowUpRight, ChevronDown, Globe, Infinity, Link2 } from "lucide-react";
import { useId, useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/SectionHeading";
import { Tag } from "@/components/ui/Tag";
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

/** A public project of the role, as one compact row: logo, name, address. */
function ProjectLink({ link }: { link: ExperienceLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      title={link.description}
      className="entry group flex items-center gap-2.5 rounded-md py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-accent/[0.06]"
    >
      {link.logo ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white p-1">
          <img src={link.logo} alt="" width={20} height={20} className="h-full w-full object-contain" />
        </span>
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-bg text-muted" aria-hidden="true">
          <Globe size={14} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="entry-title block truncate text-[13px] font-medium leading-tight transition-colors">{link.label}</span>
        <span className="flex items-center gap-1 font-mono text-[10.5px] leading-tight text-muted transition-colors group-hover:text-accent">
          <Link2 size={9} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{hostOf(link)}</span>
        </span>
      </span>
      <ArrowUpRight size={14} className="shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
    </a>
  );
}

/** A small heading with the site's star in front. */
function Heading({ children }: { children: string }) {
  return (
    <h4 className="mb-3 flex items-baseline gap-2 font-display text-sm font-semibold tracking-tight">
      <span className="text-[13px] font-normal text-accent-2" aria-hidden="true">
        ✦
      </span>
      {children}
    </h4>
  );
}

/** "2023-12" as "December 2023" (the month in the language of the page). */
const MONTHS: Record<string, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  az: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"],
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
};

function monthYear(value: string, locale: string): string {
  const [year, month] = value.split("-").map(Number);
  return `${(MONTHS[locale] ?? MONTHS.en)[month - 1]} ${year}`;
}

function Job({ item }: { item: ExperienceItem }) {
  const { ui } = useContent();
  const { locale } = useLocale();
  const hasProjects = Boolean(item.projects && item.projects.length > 0);
  const hasHighlights = Boolean(item.highlights && item.highlights.length > 0);
  // A job I still have opens expanded; the earlier ones start folded and open on a click.
  const [open, setOpen] = useState(Boolean(item.current));
  const panelId = useId();

  return (
    <Reveal className="exp-job">
      {/* The bar: who and where on the left, when on the right. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={`-mx-2 flex w-[calc(100%+1rem)] cursor-pointer flex-wrap items-center gap-x-4 gap-y-3 rounded-xl bg-gradient-to-r to-transparent px-4 py-3.5 text-left transition-colors duration-300 ${open ? "from-accent/[0.08] via-surface-2/20" : "from-surface-2/60 via-surface-2/20 hover:from-surface-2"}`}
      >
        {item.logo && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-white p-1.5">
            <img src={item.logo} alt="" width={28} height={28} className="h-full w-full object-contain" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug">{item.role}</h3>
          <p className="text-sm leading-snug text-muted">{item.org}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="sr-only">{item.period}</span>
          {/* The dates and the length of the job are one pill: the range, a thin divider, then the length in the accent colour. */}
          <span aria-hidden="true" className="inline-flex h-[26px] items-center gap-2.5 whitespace-nowrap rounded-full border border-border bg-surface-2 px-3 font-mono text-xs leading-none">
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span>{monthYear(item.start, locale)} —</span>
              {item.end ? <span>{monthYear(item.end, locale)}</span> : <Infinity size={16} strokeWidth={2.4} />}
            </span>
            <span className="h-3.5 w-px bg-border" />
            <span className="text-accent">{formatDuration(item.start, item.end, locale)}</span>
          </span>
          {item.current && (
            <span className="inline-flex h-[26px] items-center gap-1 rounded-full border border-accent-2/40 bg-accent-2/10 pl-2.5 pr-3.5 font-mono text-xs leading-none text-accent-2">
              <span className="now-dot" aria-hidden="true">
                <span className="now-dot-ring" />
                <span className="now-dot-core" />
              </span>
              {ui.experienceLabels.now}
            </span>
          )}
          <ChevronDown size={18} aria-hidden="true" className={`shrink-0 text-muted transition-[transform,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-180 text-accent" : ""}`} />
        </div>
      </button>

      {/* Everything under the bar folds away: the row height eases between 0 and its full size. */}
      <div id={panelId} className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div
          className={`min-h-0 overflow-hidden transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "translate-y-0 opacity-100 delay-75" : "-translate-y-2 opacity-0"}`}
          inert={!open}
        >
      {/* The body: what I did, and what it was for, in two halves. */}
      <div className="grid md:grid-cols-2">
        <div className="min-w-0 px-2 py-5">
          <p className="mb-4 text-sm leading-relaxed text-muted">{item.description}</p>
          {hasHighlights && (
            <>
              <Heading>{ui.experienceLabels.results}</Heading>
              <ul className="space-y-2">
                {item.highlights!.map((highlight) => (
                  <li key={highlight} className="flex gap-3 text-[13px] leading-snug text-muted">
                    <span className="mt-[0.45rem] h-px w-3 shrink-0 bg-accent" aria-hidden="true" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {hasProjects && (
          <div className="min-w-0 border-t border-border px-2 py-5 md:border-l md:border-t-0 md:pl-6">
            <Heading>{ui.experienceLabels.publicProjects}</Heading>
            <div className="grid gap-1.5">
              {item.projects!.map((project) => (
                <ProjectLink key={project.url} link={project} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* The footer: the stack. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-2 py-3.5">
        <h4 className="flex items-baseline gap-2 font-display text-sm font-semibold tracking-tight">
          <span className="text-[13px] font-normal text-accent-2" aria-hidden="true">
            ✦
          </span>
          {ui.experienceLabels.stack}
        </h4>
        <ul className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <li key={tag}>
              <Tag>{tag}</Tag>
            </li>
          ))}
        </ul>
      </div>
        </div>
      </div>
    </Reveal>
  );
}

export function Experience() {
  const { experience, ui } = useContent();
  // The newest job first, the oldest last: plain rows on one rail, with no boxes and no rules between them.
  const jobs = [...experience].sort((a, b) => b.start.localeCompare(a.start));
  useClock(); // so an ongoing job's length rolls over at the turn of a month, even in a tab left open

  return (
    <Section id="experience" title={ui.sections.experience.title}>
      <div>
        {jobs.map((item) => (
          <Job key={`${item.org}-${item.role}`} item={item} />
        ))}
      </div>
    </Section>
  );
}

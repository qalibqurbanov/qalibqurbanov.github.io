import { ArrowUpRight, ChevronDown, Database, Container as DockerIcon, FolderGit2, Gauge, Layers, ServerCog } from "lucide-react";
import { useState } from "react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionClosing } from "@/components/ui/SectionClosing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useClock } from "@/hooks/useClock";
import { useContent, useLocale } from "@/i18n/context";
import { formatDuration } from "@/lib/duration";
import type { ExperienceItem, ExperienceLink } from "@/types/content";

const HIGHLIGHT_ICONS = [ServerCog, Database, Gauge, DockerIcon];

function hostOf(link: ExperienceLink): string {
  try {
    return new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    return link.url;
  }
}

function initialsOf(label: string): string {
  return label
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** A project that can be opened: initials square, name, domain, arrow. Looks nothing like the tech row. */
function ProjectCard({ link }: { link: ExperienceLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-2.5 rounded-lg border border-border bg-surface-2/60 p-2 pr-3 transition-colors hover:border-accent/60"
    >
      {link.logo ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white p-1">
          <img src={link.logo} alt="" width={28} height={28} className="h-full w-full object-contain" />
        </span>
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-accent/40 to-accent-2/30 font-mono text-xs font-bold text-text">
          {initialsOf(link.label)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-text">{link.label}</span>
        <span className="line-clamp-2 text-[11px] leading-snug text-muted">{link.description ?? hostOf(link)}</span>
      </span>
      <ArrowUpRight
        size={15}
        className="shrink-0 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
      />
    </a>
  );
}

function Details({ item }: { item: ExperienceItem }) {
  const { ui } = useContent();
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{item.description}</p>
      {item.highlights && item.highlights.length > 0 && (
        <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {item.highlights.map((highlight, index) => {
            const Icon = HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length];
            return (
              <li key={highlight} className="flex gap-2.5 text-[13px] leading-snug text-muted">
                <Icon size={15} className="mt-0.5 shrink-0 text-accent" />
                {highlight}
              </li>
            );
          })}
        </ul>
      )}
      {item.projects && item.projects.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-accent">
            <FolderGit2 size={12} />
            {ui.experienceLabels.publicProjects}
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {item.projects.map((project) => (
              <ProjectCard key={project.url} link={project} />
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-0.5 gap-y-1">
        <span className="mr-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
          <Layers size={12} />
          {ui.experienceLabels.stack}
        </span>
        {item.tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1.5 px-1.5 py-0.5 font-mono text-[11px] text-text/80">
            <span className="h-1 w-1 rounded-full bg-accent-2" />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Experience() {
  const { experience, ui } = useContent();
  const { locale } = useLocale();
  useClock(); // so an ongoing job's length rolls over at the turn of a month, even in a tab left open

  // The current job starts open; with no current job everything starts closed.
  const [openIndex, setOpenIndex] = useState<number | null>(() => {
    const current = experience.findIndex((item) => item.current);
    return current === -1 ? null : current;
  });

  return (
    <section id="experience" className="py-28">
      <Container>
        <SectionHeading id="experience" index={ui.sections.experience.index} title={ui.sections.experience.title} />

        <Reveal className="card-surface divide-y divide-border overflow-hidden rounded-2xl">
          {experience.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={`${item.org}-${item.role}`} className={isOpen ? "bg-accent/[0.03]" : ""}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/5"
                >
                  {item.logo ? (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white/[0.06] p-1.5">
                      <img src={item.logo} alt="" width={28} height={28} className="h-full w-full object-contain" />
                    </span>
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-base font-bold text-bg">
                      {item.org[0]}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 text-[15px] font-semibold text-text">
                      {item.role}
                      <span className="font-normal text-muted">· {item.org}</span>
                      {item.current && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2 py-px font-mono text-[10px] text-accent">
                          <span className="relative inline-flex h-1.5 w-1.5" aria-hidden="true">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                          </span>
                          {ui.experienceLabels.now}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 font-mono text-[11px] text-muted">
                      <span>{item.period}</span>
                      <span className="text-accent">{formatDuration(item.start, item.end, locale)}</span>
                    </span>
                  </span>
                  <ChevronDown size={18} className={`shrink-0 text-accent transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 sm:pl-[4.25rem]">
                      <Details item={item} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>

        <SectionClosing />
      </Container>
    </section>
  );
}

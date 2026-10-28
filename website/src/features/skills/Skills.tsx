import { MonitorSmartphone, Server, Wrench } from "lucide-react";
import type { ComponentType } from "react";

import { Container } from "@/components/ui/Container";
import { GlitchText } from "@/components/ui/GlitchText";
import { Reveal } from "@/components/ui/Reveal";
import { SectionClosing } from "@/components/ui/SectionClosing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";
import type { SkillCategory } from "@/types/content";

type Icon = ComponentType<{ className?: string; size?: number }>;

const ICON_TILE = "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10";
const BOX = "card-surface flex flex-col rounded-xl p-5 sm:p-6";

interface SkillListMeta {
  category: SkillCategory;
  icon: Icon;
  /** Where the box sits in the grid. */
  span: string;
  large?: boolean;
}

const lists: SkillListMeta[] = [
  { category: "backend", icon: Server, span: "sm:col-span-2 lg:col-span-2 lg:row-span-2", large: true },
  { category: "tools", icon: Wrench, span: "sm:col-span-2 lg:col-span-2" },
];

/** Skills that belong together share one labelled row. Names and labels are technical terms, so
 * like the skills themselves they stay the same across locales. */
const clusterRows: Record<SkillCategory, { label: string; members: string[] }[]> = {
  backend: [
    { label: "Framework", members: ["C#", "ASP.NET MVC", "ASP.NET Web API"] },
    { label: "ORM", members: ["EF Core", "Dapper"] },
    { label: "Data", members: ["Microsoft SQL Server", "MySQL", "PostgreSQL", "MongoDB", "Redis", "MinIO"] },
    { label: "Real-time", members: ["SignalR", "Event-Driven Programming"] },
    { label: "Observability", members: ["Serilog", "Elasticsearch", "Kibana"] },
    { label: "Jobs", members: ["Quartz", "Hangfire"] },
  ],
  tools: [
    { label: "VCS", members: ["Git", "GitLab", "GitHub"] },
    { label: "Platform", members: ["Docker", "Linux"] },
  ],
};

export function Skills() {
  const { skills, ui } = useContent();
  const backend = lists[0];
  const tools = lists[1];

  const chip = (skill: string, large?: boolean, compact?: boolean) => (
    <li key={skill} data-glitch-host className={`skill-chip font-mono text-muted ${compact ? "skill-chip-compact" : ""} ${large ? "text-sm" : "text-xs"}`}>
      <span className="text-accent/70" aria-hidden="true">
        ▹
      </span>
      <GlitchText text={skill} />
    </li>
  );

  const clusters = (category: SkillCategory, items: string[], large?: boolean) => {
    const present = clusterRows[category]
      .map((cluster) => ({ label: cluster.label, members: items.filter((item) => cluster.members.includes(item)) }))
      .filter((cluster) => cluster.members.length > 0);
    const grouped = new Set(present.flatMap((cluster) => cluster.members));
    const loose = items.filter((item) => !grouped.has(item));
    return (
      <>
        {loose.length > 0 && <ul className="mb-4 flex flex-wrap content-start gap-2.5">{loose.map((item) => chip(item, large))}</ul>}
        <div className="divide-y divide-border/60 border-y border-border/60">
          {present.map((cluster) => (
            <div key={cluster.label} className="flex flex-col gap-1.5 py-2 sm:flex-row sm:items-start sm:gap-3">
              <span className="shrink-0 pt-1 font-mono text-[10px] uppercase tracking-widest text-accent/80 sm:w-24">
                {cluster.label}
              </span>
              <ul className="flex flex-wrap gap-1.5">{cluster.members.map((item) => chip(item, false, true))}</ul>
            </div>
          ))}
        </div>
      </>
    );
  };

  const list = ({ category, icon: Icon, span, large }: SkillListMeta, delayMs: number) => (
    <div key={category} className={span}>
      <Reveal delayMs={delayMs} className={BOX}>
        <div className="mb-5 flex items-center gap-3">
          <div className={ICON_TILE}>
            <Icon className="text-accent" size={20} />
          </div>
          <h3 className="font-semibold text-text">{ui.skillGroups[category]}</h3>
          <span className="ml-auto rounded-md border border-border px-2 py-0.5 font-mono text-[11px] tabular-nums text-muted">
            {String(skills[category].length).padStart(2, "0")}
          </span>
        </div>
        {clusters(category, skills[category], large)}
      </Reveal>
    </div>
  );

  return (
    <section id="skills" className="py-28">
      <Container>
        <SectionHeading id="skills" index={ui.sections.skills.index} title={ui.sections.skills.title} />

        {/* A bento grid: backend is one big tile (two columns, two rows); the front-end and mobile note and the tools sit beside it. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {list(backend, 0)}

          <div className="sm:col-span-2 lg:col-span-2">
            <Reveal delayMs={75} className={BOX}>
              <div className="mb-4 flex items-center gap-3">
                <div className={ICON_TILE}>
                  <MonitorSmartphone className="text-accent" size={20} />
                </div>
                <h3 className="font-semibold text-text">{ui.skillsClient.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted">{ui.skillsClient.text}</p>
            </Reveal>
          </div>

          {list(tools, 150)}
        </div>

        <SectionClosing />
      </Container>
    </section>
  );
}

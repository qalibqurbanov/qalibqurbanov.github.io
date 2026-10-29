import { MonitorSmartphone, Server, Wrench } from "lucide-react";
import type { ComponentType, CSSProperties, KeyboardEvent } from "react";
import { useEffect, useState } from "react";

import { Container } from "@/components/ui/Container";
import { GlitchText } from "@/components/ui/GlitchText";
import { Reveal } from "@/components/ui/Reveal";
import { SectionClosing } from "@/components/ui/SectionClosing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";
import type { SkillCategory } from "@/types/content";

type Icon = ComponentType<{ className?: string; size?: number }>;

/** The tabs: the two groups of skills, then the note about the front end and mobile. */
type TabId = SkillCategory | "client";

const TABS: { id: TabId; icon: Icon; color: string }[] = [
  { id: "backend", icon: Server, color: "var(--color-accent)" },
  { id: "tools", icon: Wrench, color: "var(--color-accent-2)" },
  { id: "client", icon: MonitorSmartphone, color: "var(--color-syn-number)" },
];

/** Skills that belong together share one labelled row. Names and labels are technical terms, so
 * like the skills themselves they stay the same across locales.
 *
 * The order inside a row is the order written here, and it runs from the abstract to the concrete:
 * foundations and helpers first (a language, a technique's support tools, a general style), then the
 * specific things built on them (a framework, a named practice, a product). Keep to this when adding. */
const clusterRows: Record<SkillCategory, { label: string; members: string[] }[]> = {
  backend: [
    { label: ".NET", members: ["C#", "ASP.NET MVC", "ASP.NET Web API"] },
    { label: "API design", members: ["REST API design", "Swagger / OpenAPI"] },
    { label: "Security", members: ["JWT / OAuth 2.0"] },
    { label: "Architecture & design", members: ["Domain-Driven Design (DDD)", "N-Tier Architecture", "Clean / Onion Architecture", "Hexagonal Architecture", "Vertical Slice Architecture", "Modular Monolith Architecture", "Event-Driven Architecture", "CQRS", "MediatR"] },
    { label: "Data access", members: ["EF Core", "Dapper"] },
    { label: "Databases", members: ["PostgreSQL", "Microsoft SQL Server", "MySQL", "MongoDB"] },
    { label: "Cache & storage", members: ["Redis", "MinIO"] },
    { label: "Messaging", members: ["RabbitMQ", "Kafka"] },
    { label: "Real-time", members: ["WebSockets", "SignalR"] },
    { label: "Background jobs", members: ["BackgroundService / IHostedService", "Hangfire", "Quartz"] },
    { label: "Observability", members: ["OpenTelemetry", "Serilog", "Elasticsearch", "Kibana", "Prometheus & Grafana"] },
    { label: "Testing", members: ["Mocking", "Unit testing", "Integration testing", "Architecture testing"] },
  ],
  tools: [
    { label: "Version control", members: ["Git"] },
    { label: "CI/CD", members: ["GitLab CI/CD", "GitHub Actions"] },
    { label: "Containers", members: ["Docker"] },
    { label: "Server", members: ["Linux", "Nginx"] },
  ],
};

/** On a phone a row with more than this many skills shows the first few and a "+N more" button. */
const FOLD_AFTER = 6;
const FOLD_SHOWN = 4;
const PHONE = "(max-width: 767px)";

function useIsPhone(): boolean {
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE).matches);
  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const update = () => setPhone(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return phone;
}

/** Splits rows into `count` runs of about the same height, keeping their order. A row is about as tall as
 * the text of its chips is long, so that is what it weighs. */
function splitRows<T extends { members: string[] }>(rows: T[], count: number): T[][] {
  if (count <= 1) return [rows];
  const weight = (row: T) => row.members.reduce((sum, member) => sum + member.length + 6, 0) + 14;
  const total = rows.reduce((sum, row) => sum + weight(row), 0);
  const groups: T[][] = Array.from({ length: count }, () => []);
  let used = 0;
  for (const row of rows) {
    const index = Math.min(count - 1, Math.floor(((used + weight(row) / 2) / total) * count));
    groups[index].push(row);
    used += weight(row);
  }
  return groups;
}

export function Skills() {
  const { skills, ui } = useContent();
  const phone = useIsPhone();
  const [active, setActive] = useState<TabId>("backend");
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = (label: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(label)) next.add(label);
      return next;
    });

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = TABS[(index + step + TABS.length) % TABS.length];
    setActive(next.id);
    document.getElementById(`skills-tab-${next.id}`)?.focus();
  };

  const chip = (skill: string) => (
    <li key={skill} data-glitch-host className="skill-chip skill-chip-compact font-mono text-xs text-muted">
      <span className="text-accent/70" aria-hidden="true">
        ▹
      </span>
      <GlitchText text={skill} />
    </li>
  );

  const row = (cluster: { label: string; members: string[] }) => {
    const long = phone && cluster.members.length > FOLD_AFTER;
    const folded = long && !open.has(cluster.label);
    const shown = folded ? cluster.members.slice(0, FOLD_SHOWN) : cluster.members;
    return (
      <div
        key={cluster.label}
        className="flex flex-wrap items-center gap-1.5 border-t border-border/60 py-2 first:border-t-0 md:grid md:grid-cols-[8rem_1fr] md:items-start md:gap-3 md:py-2.5"
      >
        <span className="shrink-0 pr-1.5 font-mono text-[9.5px] uppercase tracking-widest text-accent/80 md:pr-0 md:pt-1 md:text-[10px]">
          {cluster.label}
        </span>
        <ul className="contents md:flex md:flex-wrap md:gap-1.5">
          {shown.map(chip)}
          {long && (
            <li>
              <button
                type="button"
                aria-expanded={!folded}
                onClick={() => toggle(cluster.label)}
                className="rounded-lg border border-dashed border-accent/50 px-2 py-0.5 font-mono text-[11px] text-accent transition-colors hover:bg-accent/10"
              >
                {folded ? format(ui.skillsList.more, { count: String(cluster.members.length - FOLD_SHOWN) }) : ui.skillsList.less}
              </button>
            </li>
          )}
        </ul>
      </div>
    );
  };

  const rows = (category: SkillCategory) => {
    const items = skills[category];
    const present = clusterRows[category]
      .map((cluster) => ({ label: cluster.label, members: cluster.members.filter((member) => items.includes(member)) }))
      .filter((cluster) => cluster.members.length > 0);
    const grouped = new Set(present.flatMap((cluster) => cluster.members));
    const loose = items.filter((item) => !grouped.has(item));
    const columns = phone ? [present] : splitRows(present, 2);
    return (
      <>
        {loose.length > 0 && <ul className="mb-2 flex flex-wrap gap-1.5 pt-2">{loose.map(chip)}</ul>}
        <div className="grid gap-x-10 md:grid-cols-2">
          {columns.map((column, index) => (
            <div key={index}>{column.map(row)}</div>
          ))}
        </div>
      </>
    );
  };

  return (
    <section id="skills" className="py-28">
      <Container>
        <SectionHeading id="skills" index={ui.sections.skills.index} title={ui.sections.skills.title} />

        <Reveal className="card-surface overflow-hidden rounded-xl">
          <div role="tablist" aria-label={ui.sections.skills.title} className="flex gap-0.5 overflow-x-auto border-b border-border px-2 pt-2 [scrollbar-width:none]">
            {TABS.map((tab, index) => {
              const selected = tab.id === active;
              const Icon = tab.icon;
              const label = tab.id === "client" ? ui.skillsClient.title : ui.skillGroups[tab.id];
              return (
                <button
                  key={tab.id}
                  id={`skills-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="skills-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(tab.id)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  style={{ "--tab-color": tab.color } as CSSProperties}
                  // On a phone the three tabs share the row, each with its icon above its name, so they always fit.
                  className={`relative inline-flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-t-lg px-2 pb-3 pt-2.5 text-center font-mono text-[11.5px] leading-tight transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--tab-color)] md:flex-none md:flex-row md:gap-2 md:px-4 md:text-left md:text-[13px] md:leading-normal ${
                    selected ? "bg-[color-mix(in_srgb,var(--tab-color)_9%,transparent)] text-text" : "text-muted hover:text-text"
                  }`}
                >
                  <span style={selected ? { color: tab.color, filter: `drop-shadow(0 0 6px ${tab.color})` } : undefined}>
                    <Icon size={16} />
                  </span>
                  {label}
                  {tab.id !== "client" && (
                    <span className="hidden rounded-full border border-border bg-surface-2 px-1.5 text-[10px] leading-4 text-muted md:inline">{skills[tab.id].length}</span>
                  )}
                  {selected && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full" style={{ background: tab.color, boxShadow: `0 0 12px ${tab.color}` }} />}
                </button>
              );
            })}
          </div>

          {/* No fixed height: the box is exactly as tall as the tab that is open, so nothing can be cut off. */}
          <div role="tabpanel" id="skills-panel" aria-labelledby={`skills-tab-${active}`} className="px-3 pb-3 pt-1 md:px-5 md:pb-4">
            <div key={active} className="skills-panel-in">
              {active === "client" ? (
                <div className="max-w-prose px-1 py-5">
                  <h3 className="mb-2 font-mono text-[13px] text-text">{ui.skillsClient.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{ui.skillsClient.text}</p>
                </div>
              ) : (
                rows(active)
              )}
            </div>
          </div>
        </Reveal>

        <SectionClosing />
      </Container>
    </section>
  );
}

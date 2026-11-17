import { Fragment, useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";

type Tab = "backend" | "tools" | "learning";

/** What each skill is, in plain words, shown in grey after its name. Say what the thing concretely is, never a
 * vague word like "style" or "approach". Like the names, these are technical terms, so they stay the same
 * across locales. */
const kinds: Record<string, string> = {
  "C#": "programming language",
  Go: "programming language",
  "ASP.NET Core Web API": "C# web framework",
  Gin: "Go web framework",
  "REST API design": "HTTP API design principles",
  "Swagger / OpenAPI": "API specification and documentation",
  "JWT / OAuth 2.0": "token-based authentication and authorization",
  "N-Tier Architecture": "architecture pattern",
  "Clean / Onion Architecture": "architecture pattern",
  "Hexagonal Architecture": "architecture pattern",
  "Vertical Slice Architecture": "architecture pattern",
  "Modular Monolith Architecture": "architecture pattern",
  "Event-Driven Architecture": "architecture pattern",
  "Domain-Driven Design (DDD)": "business domain modelling",
  CQRS: "design pattern",
  Mediator: "design pattern",
  "EF Core": "ORM",
  Dapper: "micro-ORM",
  PostgreSQL: "relational database",
  "Microsoft SQL Server": "relational database",
  MySQL: "relational database",
  MongoDB: "document database",
  Redis: "in-memory cache",
  MinIO: "S3-compatible object storage",
  RabbitMQ: "message broker",
  Kafka: "event streaming platform",
  WebSockets: "two-way real-time protocol",
  SignalR: "real-time library",
  "BackgroundService / IHostedService": "built-in background tasks",
  Hangfire: "job scheduler",
  Quartz: "job scheduler",
  Serilog: "structured logging",
  OpenTelemetry: "tracing, metrics and logs standard",
  Elasticsearch: "search and log storage engine",
  Kibana: "Elasticsearch dashboards",
  "Prometheus & Grafana": "metrics and dashboards",
  Mocking: "replacing dependencies in tests",
  "Unit testing": "automated tests",
  "Integration testing": "automated tests",
  "Architecture testing": "architecture rule tests",
  "API versioning": "evolving an API without breaking clients",
  Pagination: "returning long lists in pages",
  gRPC: "binary RPC protocol over HTTP/2",
  GraphQL: "query language for APIs",
  "OpenID Connect": "identity layer on top of OAuth 2.0",
  "Role-based access control": "permissions given by role",
  "OWASP Top 10": "the most common web vulnerabilities",
  CORS: "which sites may call the API from a browser",
  "Rate limiting": "stopping abuse and overload",
  "Password hashing": "storing passwords safely",
  "Database migrations": "versioned changes to the schema",
  Transactions: "all-or-nothing database changes",
  "Database normalization": "tables without duplicated data",
  "Database indexing": "making lookups fast",
  "Query optimization": "making slow queries fast",
  "Full-text search": "searching text by relevance",
  "Search indexing": "preparing data to be searched fast",
  NATS: "lightweight messaging system",
  "Server-Sent Events": "one-way live updates over HTTP",
  Microservices: "many small independent services",
  "API gateway": "one entry point in front of services",
  "Saga pattern": "distributed transactions with compensation",
  "Outbox pattern": "reliable events published with the database",
  Idempotency: "safe repeated requests",
  "Retry with backoff": "trying failed calls again, waiting longer each time",
  "Circuit breaker": "stops calling a service that keeps failing",
  "Load testing": "checking behaviour under heavy traffic",
  k6: "load testing tool",
  Profiling: "finding where time and memory go",
  "Test-driven development (TDD)": "writing the test before the code",
  "Contract testing": "checking the agreed API shape between services",
  Testcontainers: "real dependencies in disposable containers",
  Git: "version control",
  "GitLab CI/CD": "build and deploy pipelines",
  "GitHub Actions": "build and deploy pipelines",
  Docker: "containers",
  Linux: "server operating system",
  Nginx: "web server and reverse proxy",
};

/** The skills of each tab, sorted into labelled groups, and inside a group into lines. Names and labels are
 * technical terms, so like the skills themselves they stay the same across locales.
 *
 * How to list things (keep to this when adding):
 * - A group's name never depends on one language or product ("Databases", not ".NET data"), so a second
 *   language fits into the same groups later. Two unrelated things never share a group.
 * - A group is made of lines. Things that belong together share one line (a language with its framework, the
 *   SQL databases); things that do not get a line of their own.
 * - The order inside a group is the order written here, and it runs from the abstract to the concrete:
 *   foundations and helpers first (a language, a technique's support tools, a general style), then the
 *   specific things built on them (a framework, a named practice, a product).
 * - Every group title has the pink star, like the About page, and every line starts with a dash (—). Every skill
 *   has a short grey line after its name (see `kinds`) saying what it is; neighbouring skills with the same line
 *   share it, said once after them. A framework names its language ("C# web framework").
 * - Legacy or rarely used things are left out; only what can be talked about in an interview is listed. */
const groups: Record<Tab, { label: string; hint: string; lines: string[][] }[]> = {
  backend: [
    { label: "Languages & frameworks", hint: "The language and the frameworks everything is built on.", lines: [["C#", "ASP.NET Core Web API"]] },
    { label: "API design", hint: "How the API is shaped and documented.", lines: [["REST API design", "Swagger / OpenAPI"], ["API versioning", "Pagination"], ["gRPC", "GraphQL"]] },
    { label: "Security", hint: "Who may call the API, and what they may do.", lines: [["JWT / OAuth 2.0", "OpenID Connect"], ["Role-based access control"], ["OWASP Top 10", "CORS"], ["Rate limiting", "Password hashing"]] },
    {
      label: "Architecture",
      hint: "How the whole system is shaped.",
      lines: [["N-Tier Architecture", "Clean / Onion Architecture", "Hexagonal Architecture", "Vertical Slice Architecture", "Modular Monolith Architecture", "Event-Driven Architecture"]],
    },
    { label: "Design principles & patterns", hint: "How the code inside is designed so it stays easy to change.", lines: [["Domain-Driven Design (DDD)"], ["CQRS", "Mediator"]] },
    { label: "Data access", hint: "How the code talks to the database.", lines: [["EF Core", "Dapper"], ["Database migrations", "Transactions"]] },
    { label: "Databases", hint: "Where the data lives for good.", lines: [["PostgreSQL", "Microsoft SQL Server", "MySQL"], ["MongoDB"], ["Database normalization", "Database indexing", "Query optimization"]] },
    { label: "Caching", hint: "Fast lookups, so the database is not asked twice.", lines: [["Redis"]] },
    { label: "File & object storage", hint: "Where uploaded files and large objects live.", lines: [["MinIO"]] },
    { label: "Search", hint: "Finding things by text, fast and by relevance.", lines: [["Full-text search", "Search indexing"]] },
    { label: "Messaging", hint: "Services talking without waiting for each other.", lines: [["RabbitMQ", "Kafka", "NATS"]] },
    { label: "Real-time", hint: "Updates pushed to the user instantly.", lines: [["WebSockets", "SignalR", "Server-Sent Events"]] },
    { label: "Background jobs", hint: "Work that runs on its own, later or on a timer.", lines: [["BackgroundService / IHostedService"], ["Hangfire", "Quartz"]] },
    { label: "Distributed systems & resilience", hint: "Many services that keep working when one of them fails.", lines: [["Microservices", "API gateway"], ["Saga pattern", "Outbox pattern", "Idempotency"], ["Retry with backoff", "Circuit breaker"]] },
    { label: "Performance", hint: "Finding out how fast it is, and why it is slow.", lines: [["Load testing", "k6"], ["Profiling"]] },
    { label: "Observability", hint: "Seeing what the system does in production.", lines: [["OpenTelemetry"], ["Serilog", "Elasticsearch", "Kibana"], ["Prometheus & Grafana"]] },
    { label: "Testing", hint: "Proving it works.", lines: [["Mocking"], ["Unit testing", "Integration testing", "Architecture testing"], ["Test-driven development (TDD)"], ["Contract testing", "Testcontainers"]] },
  ],
  tools: [
    { label: "Version control", hint: "The history of every change.", lines: [["Git"]] },
    { label: "CI/CD", hint: "Build, test and deploy automatically.", lines: [["GitLab CI/CD", "GitHub Actions"]] },
    { label: "Containers", hint: "The app packed together with what it needs.", lines: [["Docker"]] },
    { label: "Server", hint: "Where it runs.", lines: [["Linux", "Nginx"]] },
  ],
  learning: [{ label: "Languages & frameworks", hint: "Self-study: learning it and building with it on my own.", lines: [["Go", "Gin"]] }],
};

/** Neighbouring skills of the same kind are listed together, with the kind said once after them. */
function runs(members: string[]): { kind: string | undefined; members: string[] }[] {
  const result: { kind: string | undefined; members: string[] }[] = [];
  for (const member of members) {
    const last = result[result.length - 1];
    if (last && last.kind && last.kind === kinds[member]) last.members.push(member);
    else result.push({ kind: kinds[member], members: [member] });
  }
  return result;
}

/** Being learned on my own, not yet used at work: they have a tab of their own, and are kept out of the Backend list. */
const learning = ["Go", "Gin"];

const tabs: { id: Tab }[] = [{ id: "backend" }, { id: "tools" }, { id: "learning" }];

export function Skills() {
  const { skills, ui } = useContent();
  const [active, setActive] = useState<Tab>("backend");

  // Only what the content lists is shown; anything the groups above don't name gets a line of its own in the last group.
  const rows = (tab: Tab) => {
    const known = tab === "learning" ? learning : skills[tab];
    const present = groups[tab].map((group) => ({
      ...group,
      lines: group.lines.map((line) => line.filter((member) => known.includes(member))).filter((line) => line.length > 0),
    }));
    const grouped = new Set(present.flatMap((group) => group.lines.flat()));
    const loose = known.filter((item) => !grouped.has(item) && !learning.includes(item));
    if (loose.length > 0 && present.length > 0) present[present.length - 1].lines.push(loose);
    return present.filter((group) => group.lines.length > 0);
  };

  return (
    <Section id="skills" title={ui.sections.skills.title}>
      <Reveal>
        {/* Plain tabs on one hairline: a thin divider between them, a line under the open one, and the count as a
            small tinted badge that takes the tab's colour when it is open. */}
        <div role="tablist" aria-label={ui.sections.skills.title} className="mb-1 flex flex-wrap items-center border-b border-border">
          {tabs.map((tab, index) => {
            const selected = tab.id === active;
            // The learning tab is in the purple of the "now" pill, with its pulsing circle, so it reads as "on the way".
            const learningTab = tab.id === "learning";
            return (
              <Fragment key={tab.id}>
                {index > 0 && <span aria-hidden="true" className="mx-5 h-5 w-px bg-border" />}
                <button
                  id={`skills-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="skills-panel"
                  onClick={() => setActive(tab.id)}
                  className={`relative inline-flex items-center gap-2.5 py-2.5 font-display text-base font-medium transition-colors ${
                    learningTab ? (selected ? "text-accent-2" : "text-accent-2/70 hover:text-accent-2") : selected ? "text-text" : "text-muted hover:text-text"
                  }`}
                >
                  {learningTab ? (
                    <span className="now-dot" aria-hidden="true">
                      <span className="now-dot-ring" />
                      <span className="now-dot-core" />
                    </span>
                  ) : (
                    <span className="now-dot now-dot-still" aria-hidden="true">
                      <span className="now-dot-core" />
                    </span>
                  )}
                  {tab.id === "learning" ? ui.skillsLearning : ui.skillGroups[tab.id]}
                  <span
                    className={`inline-flex min-w-5 items-center justify-center rounded-md px-1.5 font-mono text-xs leading-5 transition-colors ${
                      learningTab ? (selected ? "bg-accent-2/15 text-accent-2" : "bg-accent-2/10 text-accent-2/70") : selected ? "bg-accent/15 text-accent" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {rows(tab.id).reduce((sum, group) => sum + group.lines.flat().length, 0)}
                  </span>
                  {selected && <span className={`absolute inset-x-0 -bottom-px h-0.5 ${learningTab ? "bg-accent-2" : "bg-accent"}`} />}
                </button>
              </Fragment>
            );
          })}
        </div>

        <div role="tabpanel" id="skills-panel" aria-labelledby={`skills-tab-${active}`} key={active}>
          {rows(active).map((group) => (
            <div key={group.label} className="grid gap-x-6 gap-y-0.5 border-t border-border py-1.5 first:border-t-0 md:grid-cols-[11rem_1fr]">
              <h3 title={group.hint} className="text-[13px] font-medium leading-6">
                <span className="mr-2 text-[13px] font-normal text-accent-2" aria-hidden="true">
                  ✦
                </span>
                {group.label}
              </h3>
              <ul className="text-[13px] leading-6">
                {group.lines.map((line) => (
                  <li key={line[0]} className="flex items-baseline gap-2">
                    <span aria-hidden="true" className="text-accent">
                      —
                    </span>
                    <span>
                      {runs(line).map((run, index) => (
                        <span key={run.members[0]}>
                          {index > 0 && ",  "}
                          {run.members.map((skill, i) => (
                            <span key={skill}>
                              {i > 0 && ",  "}
                              <b className="skill-item cursor-default font-mono text-[13px] font-medium text-text">{skill}</b>
                            </span>
                          ))}
                          {run.kind && <em className="ml-1.5 text-[11px] not-italic text-muted/70">· {run.kind}</em>}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>

    </Section>
  );
}

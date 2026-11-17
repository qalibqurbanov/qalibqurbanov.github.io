import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";

/** The skills, sorted into categories. Names and category labels are technical terms, so like the
 * skills themselves they stay the same across locales.
 *
 * The order inside a category is the order written here, and it runs from the abstract to the concrete:
 * foundations and helpers first (a language, a technique's support tools, a general style), then the
 * specific things built on them (a framework, a named practice, a product). Keep to this when adding. */
const categories: { label: string; members: string[] }[] = [
  { label: "Backend Development", members: ["C#", "ASP.NET MVC", "ASP.NET Web API", "REST API design", "Swagger / OpenAPI", "JWT / OAuth 2.0", "Dapper", "EF Core"] },
  {
    label: "Architecture & Design Patterns",
    members: ["Domain-Driven Design (DDD)", "N-Tier Architecture", "Clean / Onion Architecture", "Hexagonal Architecture", "Vertical Slice Architecture", "Modular Monolith Architecture", "Event-Driven Architecture", "CQRS", "MediatR"],
  },
  { label: "Databases & Storage", members: ["PostgreSQL", "Microsoft SQL Server", "MySQL", "MongoDB", "MinIO"] },
  { label: "Caching & Messaging", members: ["Redis", "RabbitMQ", "Kafka"] },
  { label: "Background Processing & Real-time", members: ["BackgroundService / IHostedService", "Hangfire", "Quartz", "WebSockets", "SignalR"] },
  { label: "Monitoring & Observability", members: ["OpenTelemetry", "Serilog", "Elasticsearch", "Kibana", "Prometheus & Grafana"] },
  { label: "DevOps & Infrastructure", members: ["Linux", "Nginx", "Docker", "GitLab CI/CD", "GitHub Actions"] },
  { label: "Testing & Tools", members: ["Mocking", "Unit testing", "Integration testing", "Architecture testing", "Git"] },
];

export function Skills() {
  const { skills, ui } = useContent();

  // Only what the content lists is shown; anything the groups above don't name joins the last one.
  const known = new Set([...skills.backend, ...skills.tools]);
  const present = categories.map((category) => ({ label: category.label, members: category.members.filter((member) => known.has(member)) }));
  const grouped = new Set(present.flatMap((category) => category.members));
  const loose = [...known].filter((item) => !grouped.has(item));
  if (loose.length > 0) present[present.length - 1].members.push(...loose);

  return (
    <Section id="skills" title={ui.sections.skills.title}>
      <Reveal>
        <dl className="border-t border-border">
          {present
            .filter((category) => category.members.length > 0)
            .map((category) => (
              <div key={category.label} className="grid gap-x-8 gap-y-1.5 border-b border-border py-3.5 md:grid-cols-[17rem_1fr]">
                <dt className="text-sm font-medium">{category.label}</dt>
                <dd>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1">
                    {category.members.map((skill, index) => (
                      <li key={skill} className={`skill-item cursor-default font-mono text-[13px] text-muted ${index % 2 === 0 ? "hover:!text-accent" : "hover:!text-accent-2"}`}>
                        {skill}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
        </dl>
      </Reveal>

      <Reveal className="mt-8 grid gap-2 md:grid-cols-[17rem_1fr] md:gap-x-8">
        <h3 className="text-sm font-medium">{ui.skillsClient.title}</h3>
        <p className="text-sm leading-relaxed text-muted">{ui.skillsClient.text}</p>
      </Reveal>
    </Section>
  );
}

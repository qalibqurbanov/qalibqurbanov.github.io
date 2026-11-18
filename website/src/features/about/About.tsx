import { renderEmphasis } from "@/components/ui/emphasis";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";

/** The About page: my story as three numbered chapters (what I build, the work around the code, and life away from
 * the keyboard), then the six facts that matter most as ruled rows. */
export function About() {
  const { about, experience, ui } = useContent();
  const [focus, years, projects, based, open] = about.highlights;
  const job = experience.find((item) => item.current) ?? experience[0];

  const rows: { label: string; value: string }[] = [
    { label: focus.label, value: focus.value },
    { label: years.label, value: years.value },
    { label: projects.label, value: projects.value },
    { label: based.label, value: based.value },
    ...(job ? [{ label: ui.experienceLabels.currentlyAt, value: `${job.org} · ${job.role}` }] : []),
    { label: open.label, value: ui.contact.openTo.join(" · ") },
  ];

  return (
    <Section id="about" title={ui.sections.about.title}>
      <ol className="timeline">
        {about.paragraphs.map((paragraph, index) => (
          <li key={paragraph} className="chapter">
            <h3 className="mb-1.5 font-display text-[1.0625rem] font-semibold">
              <span className="mr-3 text-[0.8125rem] font-normal text-accent-2" aria-hidden="true">
                ✦
              </span>
              {ui.home.chapters[index]}
            </h3>
            <p className="text-[0.9375rem] leading-relaxed text-muted">{renderEmphasis(paragraph)}</p>
          </li>
        ))}
      </ol>

      <Reveal>
        <dl className="mt-8 grid grid-cols-1 gap-x-8 border-t border-border sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="border-b border-border py-2.5">
              <dt className="label">
                <span className="mr-2 text-[0.8125rem] text-accent-2" aria-hidden="true">
                  ✦
                </span>
                {row.label}
              </dt>
              <dd className="mt-0.5 text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </Section>
  );
}

import { useMemo, useState } from "react";
import { flushSync } from "react-dom";

import { Container } from "@/components/ui/Container";
import { SectionClosing } from "@/components/ui/SectionClosing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";

import { MoreProjectsCard } from "./MoreProjectsCard";
import { ProjectCard } from "./ProjectCard";

const CHIP =
  "rounded-md border px-2.5 py-1 font-mono text-xs transition-colors";

export function Projects() {
  const { projects, ui } = useContent();
  const [selected, setSelected] = useState<string[]>([]);

  // Every tag used by any project, in order of first appearance, after the
  // "all" chip that clears the filter.
  const filterTags = useMemo(() => [...new Set(projects.flatMap((project) => project.tags))], [projects]);

  // Any number of tags can be on at once; a project stays if it has at least one of them.
  const visible = selected.length
    ? projects.filter((project) => project.tags.some((item) => selected.includes(item)))
    : projects;

  // Cards glide to their new places through the View Transitions API where it
  // exists; elsewhere (or with reduced motion) the grid just updates.
  // Takes a reducer, not a value, so quick successive clicks build on each other.
  function update(change: (current: string[]) => string[]) {
    const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
    if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doc.startViewTransition(() => flushSync(() => setSelected(change)));
    } else {
      setSelected(change);
    }
  }

  function toggle(name: string) {
    update((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  }

  return (
    <section id="projects" className="py-28">
      <Container>
        <SectionHeading id="projects" index={ui.sections.projects.index} title={ui.sections.projects.title} />

        {filterTags.length > 0 && (
          <div role="group" aria-label={ui.projectList.filterLabel} className="mb-6 flex flex-wrap items-center gap-2">
            {[null, ...filterTags].map((name) => {
              // "all" is on exactly when no tag is.
              const active = name === null ? selected.length === 0 : selected.includes(name);
              return (
                <button
                  key={name ?? "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => (name === null ? update(() => []) : toggle(name))}
                  className={`${CHIP} ${
                    active
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:border-accent/50 hover:text-text"
                  }`}
                >
                  {name ?? ui.projectList.filterAll}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          {visible.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} delayMs={index * 75} />
          ))}
          {selected.length === 0 && <MoreProjectsCard delayMs={visible.length * 75} wide={visible.length % 2 === 0} />}
        </div>

        <SectionClosing />
      </Container>
    </section>
  );
}

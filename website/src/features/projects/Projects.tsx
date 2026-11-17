import { useMemo, useState } from "react";
import { flushSync } from "react-dom";

import { Section } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";

import { MoreProjects } from "./MoreProjects";
import { ProjectCard } from "./ProjectCard";
import { prefersReducedMotion } from "@/lib/motion";

const CHIP = "rounded-md border px-2.5 py-1 font-mono text-xs transition-colors [@media(pointer:coarse)]:py-2";
const SEGMENT = "transition-colors [@media(pointer:coarse)]:py-2";

type MatchMode = "any" | "all";

export function Projects() {
  const { projects, ui } = useContent();
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<MatchMode>("any");

  // Every tag used by any project, in order of first appearance, after the
  // "all" chip that clears the filter.
  const filterTags = useMemo(() => [...new Set(projects.flatMap((project) => project.tags))], [projects]);

  // "any": a project stays if it has at least one selected tag.
  // "all": it stays only if it has every one of them.
  const visible = selected.length
    ? projects.filter((project) =>
        mode === "all"
          ? selected.every((item) => project.tags.includes(item))
          : selected.some((item) => project.tags.includes(item)),
      )
    : projects;

  // Cards glide to their new places through the View Transitions API where it
  // exists; elsewhere (or with reduced motion) the grid just updates.
  function animated(change: () => void) {
    const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
    if (doc.startViewTransition && !prefersReducedMotion()) {
      doc.startViewTransition(() => flushSync(change));
    } else {
      change();
    }
  }

  // Takes a reducer, not a value, so quick successive clicks build on each other.
  function update(change: (current: string[]) => string[]) {
    animated(() => setSelected(change));
  }

  function toggle(name: string) {
    update((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  }

  return (
    <Section id="projects" title={ui.sections.projects.title}>

        {filterTags.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <div role="group" aria-label={ui.projectList.filterLabel} className="flex flex-wrap items-center gap-2">
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
                        ? "border-accent text-accent"
                        : "border-border text-muted hover:text-text"
                    }`}
                  >
                    {name ?? ui.projectList.filterAll}
                  </button>
                );
              })}
            </div>

            <div
              role="group"
              aria-label={ui.projectList.matchLabel}
              className={`inline-flex items-center gap-0.5 label gap-3 transition-opacity sm:ml-auto ${
                selected.length > 1 ? "" : "opacity-80"
              }`}
            >
              {(["any", "all"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={mode === option}
                  title={option === "any" ? ui.projectList.matchAnyHint : ui.projectList.matchAllHint}
                  onClick={() => animated(() => setMode(option))}
                  className={`${SEGMENT} ${
                    mode === option ? "!text-accent" : "hover:text-text"
                  }`}
                >
                  {option === "any" ? ui.projectList.matchAny : ui.projectList.matchAll}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
          {visible.length === 0 && (
            <p
              role="status"
              className="border-t border-border px-6 py-10 text-center text-sm text-muted sm:col-span-2"
            >
              {ui.projectList.noMatch}
            </p>
          )}
        </div>

        {selected.length === 0 && <div className="mt-4"><MoreProjects /></div>}

    </Section>
  );
}

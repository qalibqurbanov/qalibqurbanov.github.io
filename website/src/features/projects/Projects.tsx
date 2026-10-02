import { useMemo, useState } from "react";
import { flushSync } from "react-dom";

import { Container } from "@/components/ui/Container";
import { SectionClosing } from "@/components/ui/SectionClosing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";

import type { MoreVariant } from "./MoreProjects";
import { MoreProjects } from "./MoreProjects";
import { ProjectCard } from "./ProjectCard";

const CHIP = "rounded-md border px-2.5 py-1 font-mono text-xs transition-colors";
const SEGMENT = "rounded px-2.5 py-1 transition-colors";

type MatchMode = "any" | "all";

/** The closing "more on GitHub" design: variant A until one is picked.
 * `?more=b|c|d` previews another and `?more=all` shows all four side by side;
 * the preview goes away once a design is chosen. */
function previewVariants(): MoreVariant[] {
  const pick = new URLSearchParams(window.location.search).get("more");
  if (pick === "all") return ["a", "b", "c", "d"];
  return pick === "b" || pick === "c" || pick === "d" ? [pick] : ["a"];
}

export function Projects() {
  const { projects, ui } = useContent();
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<MatchMode>("any");
  const variants = useMemo(() => previewVariants(), []);

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
    if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
    <section id="projects" className="py-28">
      <Container>
        <SectionHeading id="projects" index={ui.sections.projects.index} title={ui.sections.projects.title} />

        {filterTags.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
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
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted hover:border-accent/50 hover:text-text"
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
              className={`inline-flex items-center gap-0.5 rounded-md border border-border p-0.5 font-mono text-xs transition-opacity sm:ml-auto ${
                selected.length > 1 ? "" : "opacity-60"
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
                    mode === option ? "bg-accent/10 text-accent" : "text-muted hover:text-text"
                  }`}
                >
                  {option === "any" ? ui.projectList.matchAny : ui.projectList.matchAll}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          {visible.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} delayMs={index * 75} />
          ))}
          {visible.length === 0 && (
            <p
              role="status"
              className="sm:col-span-2 rounded-xl border border-dashed border-border px-6 py-10 text-center font-mono text-sm text-muted"
            >
              {ui.projectList.noMatch}
            </p>
          )}
        </div>

        {selected.length === 0 && (
          <div className="mt-6 flex flex-col gap-6">
            {variants.map((variant) => (
              <div key={variant}>
                {variants.length > 1 && (
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted/70">
                    Variant {variant.toUpperCase()}
                  </p>
                )}
                <MoreProjects variant={variant} />
              </div>
            ))}
          </div>
        )}

        <SectionClosing />
      </Container>
    </section>
  );
}

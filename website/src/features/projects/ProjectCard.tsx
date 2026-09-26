import { ExternalLink } from "lucide-react";

import { GithubIcon } from "@/components/icons/BrandIcons";
import { Reveal } from "@/components/ui/Reveal";
import { Tag } from "@/components/ui/Tag";
import type { Project } from "@/types/content";

interface ProjectCardProps {
  project: Project;
  index: number;
  delayMs?: number;
}

function slugify(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** Project titles are translated per-locale, so they don't always yield a usable
 * filename slug — fall back to the (always-Latin) first tech tag, then an index. */
function filenameFor(project: Project, index: number) {
  const slug = slugify(project.tags[0] ?? "") || slugify(project.title) || `project-${index + 1}`;
  return `${slug}.tsx`;
}

export function ProjectCard({ project, index, delayMs = 0 }: ProjectCardProps) {
  return (
    <Reveal delayMs={delayMs}>
      <article className="card-surface group flex flex-col justify-between h-full rounded-xl overflow-hidden hover:-translate-y-1">
        <div className="flex items-center gap-4 px-5 py-3 bg-surface-2 border-b border-border">
          <div className="window-dots flex items-center gap-1.5">
            <span />
            <span />
            <span />
          </div>
          <span className="font-mono text-xs text-muted truncate">{filenameFor(project, index)}</span>
        </div>

        <div className="p-6 flex flex-col justify-between flex-1">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text group-hover:text-accent transition-colors">
                {project.title}
              </h3>
              <div className="flex items-center gap-3 text-muted shrink-0">
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${project.title} repository`}
                  className="hover:text-accent transition"
                >
                  <GithubIcon size={18} />
                </a>
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${project.title} live demo`}
                  className="hover:text-accent transition"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
            <p className="text-muted text-sm leading-relaxed">{project.description}</p>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {project.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>
      </article>
    </Reveal>
  );
}

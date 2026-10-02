import { ArrowUpRight, ExternalLink } from "lucide-react";

import { GithubIcon } from "@/components/icons/BrandIcons";
import { FileIcon } from "@/components/ui/FileIcon";
import { Reveal } from "@/components/ui/Reveal";
import { Tag } from "@/components/ui/Tag";
import { WindowControls } from "@/components/ui/WindowControls";
import { useCardParallax } from "@/hooks/useCardParallax";
import { projectHref } from "@/hooks/useProjectRoute";
import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";
import { filenameFor } from "@/lib/projectFilename";
import type { Project } from "@/types/content";

interface ProjectCardProps {
  project: Project;
  index: number;
  delayMs?: number;
}

export function ProjectCard({ project, index, delayMs = 0 }: ProjectCardProps) {
  const { ui } = useContent();
  // Neighbouring columns drift in opposite directions as the page scrolls.
  const parallaxRef = useCardParallax<HTMLDivElement>(index % 2 === 0 ? 0.03 : -0.03);

  return (
    <Reveal delayMs={delayMs}>
      <div ref={parallaxRef} className="card-hit parallax-card group h-full">
        <article
          data-project-slug={project.slug}
          className="card-surface flex flex-col justify-between h-full rounded-xl overflow-hidden group-hover:-translate-y-1.5 group-hover:scale-[1.015]"
        >
          <div className="flex items-center justify-between gap-4 pl-5 pr-1.5 py-1.5 bg-surface-2 border-b border-border transition-colors duration-300 group-hover:border-accent/40">
            <span className="flex items-center gap-2 font-mono text-xs text-muted truncate">
              <FileIcon />
              {filenameFor(project, index)}
            </span>
            <WindowControls />
          </div>

          <div className="p-6 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between mb-4">
                <a href={projectHref(project.slug)}>
                  <h3 className="text-lg font-semibold text-text group-hover:text-accent transition-colors">
                    {project.title}
                  </h3>
                </a>
                <div className="flex items-center gap-3 text-muted shrink-0">
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={format(ui.labels.repository, { title: project.title })}
                    className="hover:text-accent transition"
                  >
                    <GithubIcon size={18} />
                  </a>
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={format(ui.labels.liveDemo, { title: project.title })}
                    className="hover:text-accent transition"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
              <p className="text-muted text-sm leading-relaxed">
                {project.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mt-6">
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
              <a
                href={projectHref(project.slug)}
                className="inline-flex items-center gap-1 font-mono text-xs text-muted group-hover:text-accent transition-colors shrink-0"
              >
                {ui.commandPalette.openCaseStudy}
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </article>
      </div>
    </Reveal>
  );
}

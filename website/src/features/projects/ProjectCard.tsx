import { ArrowUpRight, Download, ExternalLink } from "lucide-react";

import { GithubIcon } from "@/components/icons/BrandIcons";
import { FileIcon } from "@/components/ui/FileIcon";
import { Reveal } from "@/components/ui/Reveal";
import { WindowControls } from "@/components/ui/WindowControls";
import { projectHref } from "@/hooks/useProjectRoute";
import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";
import { isDownloadUrl } from "@/lib/projectLinks";
import { filenameFor } from "@/lib/projectFilename";
import type { Project } from "@/types/content";

import { ProjectStatusBar } from "./ProjectStatusBar";

/** Two letters for the tile: the first letters of the first two words, or the first two letters of a single word. */
function tileLetters(title: string): string {
  const words = title.split(/s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : title.slice(0, 2)).toUpperCase();
}

interface ProjectCardProps {
  project: Project;
  index: number;
  delayMs?: number;
}

export function ProjectCard({ project, index, delayMs = 0 }: ProjectCardProps) {
  const { ui } = useContent();
  const download = isDownloadUrl(project.liveUrl);

  return (
    <Reveal delayMs={delayMs} style={{ viewTransitionName: `project-${project.slug}` }}>
      <div className="card-hit group h-full">
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

          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-3.5 mb-4">
              <span
                aria-hidden="true"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 font-display text-lg font-extrabold text-bg"
              >
                {tileLetters(project.title)}
              </span>
              <div className="min-w-0">
                <a href={projectHref(project.slug)}>
                  <h3 className="text-lg font-semibold text-text group-hover:text-accent transition-colors">
                    {project.title}
                  </h3>
                </a>
                <p className="font-mono text-[11px] text-muted">{project.kind}</p>
              </div>
            </div>
            <p className="text-muted text-sm leading-relaxed">{project.description}</p>

            <div className="mt-auto pt-6 flex flex-wrap items-center gap-2">
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={format(download ? ui.labels.download : ui.labels.liveDemo, { title: project.title })}
                className="tap inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 font-mono text-xs font-semibold text-bg transition hover:brightness-110"
              >
                {download ? <Download size={14} /> : <ExternalLink size={14} />}
                {download ? ui.labels.downloadButton : ui.labels.liveDemoButton}
              </a>
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={format(ui.labels.repository, { title: project.title })}
                className="tap inline-flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 font-mono text-xs font-medium text-text transition hover:border-accent hover:text-accent"
              >
                <GithubIcon size={14} />
                {ui.projectDetail.viewRepo}
              </a>
              <a
                href={projectHref(project.slug)}
                className="tap ml-auto inline-flex items-center gap-1 font-mono text-xs text-muted group-hover:text-accent transition-colors shrink-0"
              >
                {ui.commandPalette.openCaseStudy}
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          <ProjectStatusBar repoUrl={project.repoUrl} />
        </article>
      </div>
    </Reveal>
  );
}

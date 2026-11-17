import { Download, ExternalLink } from "lucide-react";

import { GithubIcon } from "@/components/icons/BrandIcons";
import { Reveal } from "@/components/ui/Reveal";
import { projectHref } from "@/hooks/useProjectRoute";
import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";
import { isDownloadUrl } from "@/lib/projectLinks";
import type { Project } from "@/types/content";

import { ProjectStatusBar } from "./ProjectStatusBar";

interface ProjectCardProps {
  project: Project;
}

const ACTION = "tap relative z-10 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium";

/** One project as a compact card: its kind, name and short description, the stack, the links,
 * and the live repository figures along the bottom. The whole card opens the case study. */
export function ProjectCard({ project }: ProjectCardProps) {
  const { ui } = useContent();
  const download = isDownloadUrl(project.liveUrl);

  return (
    <Reveal style={{ viewTransitionName: `project-${project.slug}` }} className="h-full">
      <article data-project-slug={project.slug} className="panel group relative flex h-full flex-col overflow-hidden">
        <div className="flex flex-1 flex-col p-5">
          <p className="label !text-accent-2">{project.kind}</p>
          <h3 className="mt-1.5 text-base font-semibold leading-snug">
            <a href={projectHref(project.slug)} className="entry-title transition-colors after:absolute after:inset-0 after:content-['']">
              {project.title}
            </a>
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{project.description}</p>

          {project.stack && project.stack.length > 0 && (
            <p className="mt-4 flex flex-wrap gap-x-2 gap-y-1 font-mono text-xs text-muted">
              {project.stack.slice(0, 4).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={format(download ? ui.labels.download : ui.labels.liveDemo, { title: project.title })}
              className={`${ACTION} btn-solid`}
            >
              {download ? <Download size={13} /> : <ExternalLink size={13} />}
              {download ? ui.labels.downloadButton : ui.labels.liveDemoButton}
            </a>
            <a href={project.repoUrl} target="_blank" rel="noreferrer" aria-label={format(ui.labels.repository, { title: project.title })} className={`${ACTION} btn-line`}>
              <GithubIcon size={13} />
              {ui.projectDetail.viewRepo}
            </a>
          </div>
        </div>

        <ProjectStatusBar repoUrl={project.repoUrl} />
      </article>
    </Reveal>
  );
}

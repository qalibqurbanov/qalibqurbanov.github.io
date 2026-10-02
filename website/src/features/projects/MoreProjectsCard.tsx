import { ArrowUpRight, FilePlus2 } from "lucide-react";

import { GithubIcon } from "@/components/icons/BrandIcons";
import { Reveal } from "@/components/ui/Reveal";
import { WindowControls } from "@/components/ui/WindowControls";
import { useContent } from "@/i18n/context";

/** The grid's last card: an empty "untitled" editor tab that points at the rest
 * of the repositories, so a short list of projects does not look unfinished. */
export function MoreProjectsCard({ delayMs = 0, wide = false }: { delayMs?: number; wide?: boolean }) {
  const { socials, ui } = useContent();

  return (
    <Reveal delayMs={delayMs} className={wide ? "sm:col-span-2" : ""} style={{ viewTransitionName: "project-more" }}>
      <a
        href={`${socials.github}?tab=repositories`}
        target="_blank"
        rel="noreferrer"
        className="card-hit group block h-full"
      >
        <article className="card-surface flex h-full min-h-[12rem] flex-col overflow-hidden rounded-xl border-dashed group-hover:-translate-y-1.5 group-hover:scale-[1.015]">
          <div className="flex items-center justify-between gap-4 border-b border-border bg-surface-2 py-1.5 pl-5 pr-1.5 transition-colors duration-300 group-hover:border-accent/40">
            <span className="flex items-center gap-2 truncate font-mono text-xs text-muted">
              <FilePlus2 size={13} aria-hidden="true" />
              {ui.projectList.moreFile}
            </span>
            <WindowControls />
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
            <GithubIcon size={28} />
            <h3 className="text-lg font-semibold text-text transition-colors group-hover:text-accent">
              {ui.projectList.moreTitle}
            </h3>
            <p className="max-w-xs text-sm leading-relaxed text-muted">{ui.projectList.moreBody}</p>
            <span className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-muted transition-colors group-hover:text-accent">
              {ui.projectList.moreCta}
              <ArrowUpRight size={14} />
              <span className="caret ml-1" />
            </span>
          </div>
        </article>
      </a>
    </Reveal>
  );
}

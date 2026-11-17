import { ArrowUpRight } from "lucide-react";

import { GithubIcon } from "@/components/icons/BrandIcons";
import { Reveal } from "@/components/ui/Reveal";
import { useContent } from "@/i18n/context";

/** The closing row under the project grid: a link to the rest of the repositories. */
export function MoreProjects() {
  const { socials, ui } = useContent();

  return (
    <Reveal style={{ viewTransitionName: "project-more" }}>
      <a
        href={`${socials.github}?tab=repositories`}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center gap-3 border-t border-border px-1 py-4 text-sm text-muted transition-colors hover:text-accent"
      >
        <GithubIcon size={16} />
        <span className="min-w-0 flex-1">
          <span className="font-medium text-text group-hover:text-accent">{ui.projectList.moreTitle}</span>
          <span className="ml-3 hidden sm:inline">{ui.projectList.moreBody}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs">
          {ui.projectList.moreCta}
          <ArrowUpRight size={14} />
        </span>
      </a>
    </Reveal>
  );
}

import { Download, GitBranch, Star } from "lucide-react";

import { useLiveSource } from "@/hooks/useLiveSource";
import { useContent } from "@/i18n/context";
import { repoStatsSource } from "@/lib/repoStats";

/** The thin editor-style status bar along a project card's bottom edge: branch,
 * stars and downloads. It paints at once from the last known numbers, then keeps
 * itself current by polling the GitHub API for as long as the page is open (see
 * lib/liveSource.ts). The dot at its left says which it is: pulsing while the
 * numbers are live, dim when GitHub could not be reached and a saved copy is
 * shown. A card whose repository has never been reachable simply has no bar. */
export function ProjectStatusBar({ repoUrl }: { repoUrl: string }) {
  const { ui } = useContent();
  const { value: stats, live } = useLiveSource(repoStatsSource(repoUrl));
  if (!stats) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border bg-surface-2/70 px-4 py-1.5 font-mono text-[11px] text-muted transition-colors duration-300 group-hover:border-accent/40">
      <span className="inline-flex items-center gap-3">
        <span
          role="img"
          aria-label={live ? ui.labels.liveData : ui.labels.cachedData}
          title={live ? ui.labels.liveData : ui.labels.cachedData}
          className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulse bg-accent" : "bg-muted/40"}`}
        />
        <span className="inline-flex items-center gap-1">
          <GitBranch size={11} aria-hidden="true" />
          {stats.branch}
        </span>
      </span>
      <span className="inline-flex items-center gap-3">
        <span className="inline-flex items-center gap-1" title={ui.labels.stars}>
          <Star size={11} aria-hidden="true" />
          {stats.stars}
        </span>
        {stats.downloads > 0 && (
          <span className="inline-flex items-center gap-1" title={ui.labels.downloads}>
            <Download size={11} aria-hidden="true" />
            {stats.downloads}
          </span>
        )}
      </span>
    </div>
  );
}

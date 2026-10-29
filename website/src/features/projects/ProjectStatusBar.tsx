import { Download, GitBranch, Star } from "lucide-react";

import { useContent, useLocale } from "@/i18n/context";
import { getLocaleMeta } from "@/i18n/locale";
import { formatDate } from "@/lib/date";
import { repoStatsFor } from "@/lib/repoStats";

/** The thin editor-style status bar along a project card's bottom edge: branch,
 * newest commit (hash and date), stars and downloads. The numbers are read from
 * GitHub once per build and the site is rebuilt every hour (see lib/repoStats.ts),
 * so every visitor sees the same values. A card whose repository could not be read
 * at build time has no bar. */
export function ProjectStatusBar({ repoUrl }: { repoUrl: string }) {
  const { ui } = useContent();
  const { locale } = useLocale();
  const stats = repoStatsFor(repoUrl);
  if (!stats) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border bg-surface-2/70 px-4 py-1.5 font-mono text-[11px] text-muted transition-colors duration-300 group-hover:border-accent/40">
      <span className="inline-flex items-center gap-3">
        <span role="img" aria-label={ui.labels.statusData} className="block h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="inline-flex items-center gap-1">
          <GitBranch size={11} aria-hidden="true" />
          <span className="sr-only">{ui.labels.statusBranch}</span>
          {stats.branch}
        </span>
        {stats.commitSha && (
          <a
            href={`${repoUrl.replace(/\/+$/, "")}/commit/${stats.commitSha}`}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-accent"
          >
            {stats.commitSha.slice(0, 7)}
            {stats.commitDate && ` · ${formatDate(stats.commitDate, getLocaleMeta(locale).bcp47)}`}
          </a>
        )}
      </span>
      <span className="inline-flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <Star size={11} aria-hidden="true" />
          <span className="sr-only">{ui.labels.stars}</span>
          {stats.stars}
        </span>
        {stats.downloads > 0 && (
          <span className="inline-flex items-center gap-1">
            <Download size={11} aria-hidden="true" />
            <span className="sr-only">{ui.labels.downloads}</span>
            {stats.downloads}
          </span>
        )}
      </span>
    </div>
  );
}

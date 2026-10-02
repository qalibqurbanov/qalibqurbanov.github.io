import { ArrowUpRight, Plus } from "lucide-react";

import { GithubIcon } from "@/components/icons/BrandIcons";
import { Reveal } from "@/components/ui/Reveal";
import { useClock } from "@/hooks/useClock";
import { useLiveSource } from "@/hooks/useLiveSource";
import { useContent, useLocale } from "@/i18n/context";
import { getLocaleMeta } from "@/i18n/locale";
import { format } from "@/lib/format";
import { githubUser, recentReposSource, userSummarySource } from "@/lib/githubUser";
import { relativeTime } from "@/lib/relativeTime";
import { repoKey } from "@/lib/repoStats";

export type MoreVariant = "a" | "b" | "c" | "d";

const LINK = "group focus-visible:outline-none";

/** Not a project, so not a window: the closing "more on GitHub" element is a
 * slim strip under the grid. Four candidate designs, kept side by side until one
 * is picked (see Projects.tsx). */
export function MoreProjects({ variant }: { variant: MoreVariant }) {
  const { socials, projects, ui } = useContent();
  const { locale } = useLocale();
  useClock(); // keeps "2 days ago" counting
  const user = githubUser(socials.github);
  const href = `${socials.github}?tab=repositories`;

  const summary = useLiveSource(user ? userSummarySource(user) : null);
  const recent = useLiveSource(user ? recentReposSource(user) : null);
  const bcp47 = getLocaleMeta(locale).bcp47;

  if (variant === "a") {
    // A single terminal command line.
    return (
      <Reveal style={{ viewTransitionName: "project-more-a" }}>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={`${LINK} flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3 font-mono text-sm text-muted transition-colors hover:border-accent/60 hover:bg-accent/5`}
        >
          <span className="text-accent">$</span>
          <span className="min-w-0 truncate">
            gh repo list <span className="text-text">{user ?? "me"}</span>
            <span className="caret ml-1" />
          </span>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs transition-colors group-hover:text-accent">
            {ui.projectList.moreCta}
            <ArrowUpRight size={14} />
          </span>
        </a>
      </Reveal>
    );
  }

  if (variant === "b") {
    // A pill with the live repository count.
    const count = summary.value?.publicRepos;
    return (
      <Reveal className="flex justify-center" style={{ viewTransitionName: "project-more-b" }}>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={`${LINK} inline-flex items-center gap-3 rounded-full border border-border bg-surface px-5 py-2.5 font-mono text-sm text-text transition-colors hover:border-accent/60 hover:text-accent`}
        >
          <GithubIcon size={18} />
          {ui.projectList.moreTitle}
          {count !== undefined && (
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
              {format(ui.projectList.repoCount, { count: String(count) })}
            </span>
          )}
          <ArrowUpRight size={15} className="text-muted transition-colors group-hover:text-accent" />
        </a>
      </Reveal>
    );
  }

  if (variant === "c") {
    // A dashed "add" tile.
    return (
      <Reveal style={{ viewTransitionName: "project-more-c" }}>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={`${LINK} flex h-20 items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border text-muted transition-colors hover:border-accent/60 hover:bg-accent/5 hover:text-accent`}
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-current">
            <Plus size={16} />
          </span>
          <span className="font-mono text-sm">{ui.projectList.moreTitle}</span>
          <ArrowUpRight size={15} />
        </a>
      </Reveal>
    );
  }

  // d: a live feed of the latest repositories that are not featured above.
  const featured = new Set(projects.map((project) => repoKey(project.repoUrl)));
  const feed = (recent.value ?? [])
    .filter((repo) => !featured.has(`${user}/${repo.name}`.toLowerCase()))
    .slice(0, 3);
  return (
    <Reveal style={{ viewTransitionName: "project-more-d" }}>
      <div className="rounded-xl border border-dashed border-border bg-surface/40 px-4 py-3 font-mono text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-muted">
            <GithubIcon size={14} />
            {ui.projectList.moreTitle}
            <span
              role="img"
              aria-label={recent.live ? ui.labels.liveData : ui.labels.cachedData}
              title={recent.live ? ui.labels.liveData : ui.labels.cachedData}
              className={`h-1.5 w-1.5 rounded-full ${recent.live ? "animate-pulse bg-accent" : "bg-muted/40"}`}
            />
          </span>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-muted transition-colors hover:text-accent"
          >
            {ui.projectList.moreCta}
            <ArrowUpRight size={14} />
          </a>
        </div>
        {feed.length > 0 && (
          <ul className="mt-2 divide-y divide-border/60">
            {feed.map((repo) => (
              <li key={repo.name}>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 py-1.5 text-muted transition-colors hover:text-accent"
                >
                  <span className="min-w-0 flex-1 truncate text-text">{repo.name}</span>
                  {repo.language && <span className="hidden sm:inline">{repo.language}</span>}
                  <span className="shrink-0">{relativeTime(repo.pushedAt, bcp47)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Reveal>
  );
}

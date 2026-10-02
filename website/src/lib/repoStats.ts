import { getGithubJson, LiveSource } from "@/lib/liveSource";

/** What is shown about a GitHub repository: the branch, language, last push,
 * stars and downloads in a project card's status bar. */
export interface RepoStats {
  branch: string;
  language: string | null;
  /** ISO date of the last push. */
  pushedAt: string;
  stars: number;
  /** Total downloads across every release asset. */
  downloads: number;
}

/** How often an open page re-checks GitHub. */
const POLL_MS = 60_000;

/** "owner/name" (lowercase) for a GitHub repository URL, or null. */
export function repoKey(repoUrl: string): string | null {
  const match = /github\.com\/([^/]+)\/([^/?#]+)/i.exec(repoUrl);
  return match ? `${match[1]}/${match[2]}`.toLowerCase() : null;
}

async function loadRepoStats(key: string, previous: RepoStats | null): Promise<RepoStats> {
  const info = await getGithubJson<{
    default_branch?: string;
    language?: string | null;
    pushed_at?: string;
    updated_at: string;
    stargazers_count?: number;
  }>(`https://api.github.com/repos/${key}`);

  // A failed releases request must not zero a count we already knew.
  let downloads = previous?.downloads ?? 0;
  try {
    const releases = await getGithubJson<Array<{ assets?: Array<{ download_count?: number }> }>>(
      `https://api.github.com/repos/${key}/releases?per_page=100`,
    );
    downloads = 0;
    for (const release of releases) {
      for (const asset of release.assets ?? []) downloads += asset.download_count ?? 0;
    }
  } catch {
    // Keep the previous count.
  }

  return {
    branch: info.default_branch ?? "main",
    language: info.language ?? null,
    pushedAt: info.pushed_at ?? info.updated_at,
    stars: info.stargazers_count ?? 0,
    downloads,
  };
}

const sources = new Map<string, LiveSource<RepoStats>>();

/** The live source for a repository URL — one per repository however many
 * cards use it. It starts from the copy saved by the last visit, else the
 * snapshot the build took (see config/vite.config.ts), and then keeps itself
 * current by polling GitHub. Null for a URL that is not a GitHub repository. */
export function repoStatsSource(repoUrl: string): LiveSource<RepoStats> | null {
  const key = repoKey(repoUrl);
  if (!key) return null;
  let source = sources.get(key);
  if (!source) {
    source = new LiveSource<RepoStats>(
      (previous) => loadRepoStats(key, previous),
      __REPO_STATS__[key] ?? null,
      POLL_MS,
      `live:repo:${key}`,
    );
    sources.set(key, source);
  }
  return source;
}

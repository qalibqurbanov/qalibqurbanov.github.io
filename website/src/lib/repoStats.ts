/** What is shown about a GitHub repository in a project card's status bar: the
 * branch, newest commit, stars and downloads. */
export interface RepoStats {
  branch: string;
  /** Full SHA of the newest commit on the branch, and its ISO date (null when unknown). */
  commitSha: string | null;
  commitDate: string | null;
  stars: number;
  /** Total downloads across every release asset. */
  downloads: number;
}

/** "owner/name" (lowercase) for a GitHub repository URL, or null. */
export function repoKey(repoUrl: string): string | null {
  const match = /github\.com\/([^/]+)\/([^/?#]+)/i.exec(repoUrl);
  return match ? `${match[1]}/${match[2]}`.toLowerCase() : null;
}

/** The numbers for a repository URL, or null when the build could not read them.
 * They are read from GitHub once per build (see config/vite.config.ts), and the
 * deploy workflow rebuilds the site every hour, so every visitor sees the same
 * values and no visitor's browser asks GitHub for them. */
export function repoStatsFor(repoUrl: string): RepoStats | null {
  const key = repoKey(repoUrl);
  return key ? (__REPO_STATS__[key] ?? null) : null;
}

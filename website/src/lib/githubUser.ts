import { getGithubJson, LiveSource } from "@/lib/liveSource";

const POLL_MS = 60_000;

/** The account name in a GitHub profile URL, or null. */
export function githubUser(profileUrl: string): string | null {
  const match = /github\.com\/([^/?#]+)/i.exec(profileUrl);
  return match ? match[1] : null;
}

export interface UserSummary {
  publicRepos: number;
}

export interface RepoSummary {
  name: string;
  url: string;
  language: string | null;
  /** ISO date of the last push. */
  pushedAt: string;
  stars: number;
}

const summaries = new Map<string, LiveSource<UserSummary>>();
const recents = new Map<string, LiveSource<RepoSummary[]>>();

/** Live public-repository count of a GitHub account. There is no build-time
 * snapshot to start from, so it is empty until the first answer arrives. */
export function userSummarySource(user: string): LiveSource<UserSummary> {
  let source = summaries.get(user);
  if (!source) {
    source = new LiveSource<UserSummary>(
      async () => {
        const info = await getGithubJson<{ public_repos?: number }>(`https://api.github.com/users/${user}`);
        return { publicRepos: info.public_repos ?? 0 };
      },
      null,
      POLL_MS,
      `live:user:${user.toLowerCase()}`,
    );
    summaries.set(user, source);
  }
  return source;
}

/** Live list of an account's most recently pushed own repositories (forks and
 * archived ones left out), newest first. */
export function recentReposSource(user: string): LiveSource<RepoSummary[]> {
  let source = recents.get(user);
  if (!source) {
    source = new LiveSource<RepoSummary[]>(
      async () => {
        const repos = await getGithubJson<
          Array<{
            name: string;
            html_url: string;
            language?: string | null;
            pushed_at?: string;
            stargazers_count?: number;
            fork?: boolean;
            archived?: boolean;
          }>
        >(`https://api.github.com/users/${user}/repos?type=owner&sort=pushed&per_page=15`);
        return repos
          .filter((repo) => !repo.fork && !repo.archived && repo.pushed_at)
          .map((repo) => ({
            name: repo.name,
            url: repo.html_url,
            language: repo.language ?? null,
            pushedAt: repo.pushed_at as string,
            stars: repo.stargazers_count ?? 0,
          }));
      },
      null,
      POLL_MS,
      `live:recent:${user.toLowerCase()}`,
    );
    recents.set(user, source);
  }
  return source;
}

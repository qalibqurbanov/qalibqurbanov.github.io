import { BUILD_INFO } from "@/lib/buildInfo";
import { SITE_REPO_URL } from "@/lib/githubIssue";
import { getGithubJson, LiveSource } from "@/lib/liveSource";
import { repoKey } from "@/lib/repoStats";

/** The newest commit on the site's branch. */
export interface CommitInfo {
  sha: string;
  /** ISO date. */
  date: string | null;
  /** First line of the message. */
  message: string | null;
}

const POLL_MS = 60_000;

let source: LiveSource<CommitInfo> | null | undefined;

/** The live source for the site's latest commit, shown in the footer's branch
 * popup. It starts from the commit this build was made from and then follows
 * the branch on GitHub, so it keeps up with pushes made after the deploy. */
export function latestCommitSource(): LiveSource<CommitInfo> | null {
  if (source !== undefined) return source;
  const key = repoKey(SITE_REPO_URL);
  const branch = BUILD_INFO.branch ?? "main";
  source = key
    ? new LiveSource<CommitInfo>(
        async () => {
          const commit = await getGithubJson<{
            sha: string;
            commit: { message?: string; committer?: { date?: string } };
          }>(`https://api.github.com/repos/${key}/commits/${encodeURIComponent(branch)}`);
          return {
            sha: commit.sha,
            date: commit.commit.committer?.date ?? null,
            message: commit.commit.message?.split("\n")[0] ?? null,
          };
        },
        BUILD_INFO.sha ? { sha: BUILD_INFO.sha, date: BUILD_INFO.date, message: BUILD_INFO.message } : null,
        POLL_MS,
        `live:commit:${key}:${branch}`,
      )
    : null;
  return source;
}

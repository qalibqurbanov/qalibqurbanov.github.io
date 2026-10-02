import { useEffect, useState } from "react";

import { SITE_REPO_URL } from "@/lib/githubIssue";

export interface LastCommit {
  sha: string;
  url: string;
  message: string;
  date: string;
}

const CACHE_KEY = "last-commit";
/** GitHub allows 60 unauthenticated requests an hour per visitor; a cached
 * answer is reused for this long. */
const CACHE_TTL_MS = 10 * 60 * 1000;

interface Cached {
  at: number;
  commit: LastCommit;
}

function readCache(): Cached | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}

/** The site repo's most recent commit, from GitHub's public API — `null`
 * while loading, and for good if the request fails (the badge just doesn't
 * show). */
export function useLastCommit(): LastCommit | null {
  const [commit, setCommit] = useState<LastCommit | null>(() => readCache()?.commit ?? null);

  useEffect(() => {
    const cached = readCache();
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return;

    const controller = new AbortController();
    const path = new URL(SITE_REPO_URL).pathname;
    fetch(`https://api.github.com/repos${path}/commits?per_page=1`, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((list: Array<{ sha: string; html_url: string; commit: { message: string; committer: { date: string } } }>) => {
        const latest = list[0];
        if (!latest) return;
        const next: LastCommit = {
          sha: latest.sha,
          url: latest.html_url,
          message: latest.commit.message.split("\n")[0],
          date: latest.commit.committer.date,
        };
        setCommit(next);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), commit: next } satisfies Cached));
        } catch {
          // Storage unavailable: the next page load just asks again.
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return commit;
}

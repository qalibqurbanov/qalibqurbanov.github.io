import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { localizedHtml } from "./localized-html.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));

function git(...args: string[]): string | null {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null;
  } catch {
    return null;
  }
}

// What the footer shows: the branch and commit this build was made from. On
// GitHub Actions those come from the environment (the deployed branch, not
// whatever the checkout calls it); locally they come from git itself. Null
// when neither is available (e.g. a build from an unpacked archive).
const buildInfo = {
  branch: process.env.GITHUB_REF_NAME ?? git("rev-parse", "--abbrev-ref", "HEAD"),
  sha: process.env.GITHUB_SHA ?? git("rev-parse", "HEAD"),
  date: git("log", "-1", "--format=%cI"),
  message: git("log", "-1", "--format=%s"),
};

// A snapshot of the branch, language, stars and downloads of every repository
// the projects link to. It is only the first paint and the fallback: the site
// refreshes the numbers itself from the GitHub API in the visitor's browser (see
// src/lib/repoStats.ts), so they do not go stale between deploys. The deploy
// workflow passes GITHUB_TOKEN to stay clear of rate limits; any failure just
// leaves that repository out of the snapshot.
async function fetchRepoStats() {
  const stats: Record<
    string,
    { branch: string; language: string | null; pushedAt: string; stars: number; downloads: number }
  > = {};
  let source = "";
  try {
    source = fs.readFileSync(path.resolve(dirname, "../src/content/en.ts"), "utf8");
  } catch {
    return stats;
  }
  const repos = new Set<string>();
  for (const match of source.matchAll(/repoUrl:\s*"https:\/\/github\.com\/([^/"]+)\/([^/"#?]+)"/g)) {
    repos.add(`${match[1]}/${match[2]}`);
  }
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "portfolio-build" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const get = async (url: string) => {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
  };
  await Promise.all(
    [...repos].map(async (repo) => {
      try {
        const info = (await get(`https://api.github.com/repos/${repo}`)) as {
          default_branch?: string;
          language?: string | null;
          pushed_at?: string;
          updated_at: string;
          stargazers_count?: number;
        };
        let downloads = 0;
        try {
          const releases = (await get(`https://api.github.com/repos/${repo}/releases?per_page=100`)) as Array<{
            assets?: Array<{ download_count?: number }>;
          }>;
          for (const release of releases) {
            for (const asset of release.assets ?? []) downloads += asset.download_count ?? 0;
          }
        } catch {
          // Releases are optional; keep the rest.
        }
        stats[repo.toLowerCase()] = {
          branch: info.default_branch ?? "main",
          language: info.language ?? null,
          pushedAt: info.pushed_at ?? info.updated_at,
          stars: info.stargazers_count ?? 0,
          downloads,
        };
      } catch {
        // Offline, rate limited, or renamed: leave this repository out.
      }
    }),
  );
  return stats;
}

const repoStats = await fetchRepoStats();

// https://vite.dev/config/
export default defineConfig({
  // Absolute base: localized pages live at /az/ and /ru/, so a relative
  // "./assets/..." would resolve to /az/assets/... and 404. The site is a
  // user/org root site (username.github.io), which also matches the absolute
  // "/favicon.svg" and "/resume.pdf" references already in use.
  base: "/",
  plugins: [react(), localizedHtml()],
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo),
    __REPO_STATS__: JSON.stringify(repoStats),
  },
  server: {
    port: 1337,
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "../src"),
    },
  },
  css: {
    // postcss.config.js lives alongside this file in config/, not at the
    // project root, so point Vite at it explicitly.
    postcss: path.resolve(dirname, "./postcss.config.js"),
  },
});

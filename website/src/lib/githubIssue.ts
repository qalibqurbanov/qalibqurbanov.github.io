/** The site's own repo — used for "View source" and "Report a bug" links,
 * as opposed to `project.repoUrl` which points at an individual project. */
export const SITE_REPO_URL = "https://github.com/qalibqurbanov/qalibqurbanov.github.io";

/** A prefilled "New issue" link on the site's repo, tagged `bug` and noting
 * which page the reporter was on. */
export function reportBugUrl(): string {
  const params = new URLSearchParams({
    labels: "bug",
    body: `**Page:** ${window.location.href}\n\n**What happened:**\n`,
  });
  return `${SITE_REPO_URL}/issues/new?${params.toString()}`;
}

/** True when a project's "live" link is really a release or download page
 * (a GitHub Releases URL or a direct installer/archive), not a running site. */
export function isDownloadUrl(url: string): boolean {
  return /\/releases(\/|$|\?)/.test(url) || /\.(zip|exe|msi|dmg|apk)(\?|$)/i.test(url);
}

import { Bug, CheckCircle2, Clock, FileText, GitBranch, Mail } from "lucide-react";
import type { ReactNode } from "react";

import {
  GithubIcon,
  LinkedinIcon,
  MediumIcon,
  StackOverflowIcon,
  TelegramIcon,
} from "@/components/icons/BrandIcons";
import { LiveClock } from "@/components/ui/LiveClock";
import { openContactModal } from "@/components/contact/ContactModal";
import { useClock } from "@/hooks/useClock";
import { useLiveSource } from "@/hooks/useLiveSource";
import { RESUME_HREF } from "@/hooks/useProjectRoute";
import { useContent, useLocale } from "@/i18n/context";
import { getLocaleMeta } from "@/i18n/locale";
import { BUILD_INFO } from "@/lib/buildInfo";
import { latestCommitSource } from "@/lib/latestCommit";
import { reportBugUrl, SITE_REPO_URL } from "@/lib/githubIssue";
import { relativeTime } from "@/lib/relativeTime";

interface FooterIconLinkProps {
  /** Omit for a button (uses `onClick`) instead of a link. */
  href?: string;
  onClick?: () => void;
  label: string;
  external?: boolean;
  /** "accent", "danger", and "accent2" give the icon its own soft badge
   * instead of the row's plain muted-to-accent hover, so it reads as a
   * distinct kind of action (not another social link) without needing a
   * divider next to it. */
  tone?: "default" | "accent" | "danger" | "accent2";
  children: ReactNode;
}

const TONE_CLASSES: Record<NonNullable<FooterIconLinkProps["tone"]>, string> = {
  default: "group relative inline-flex items-center hover:text-accent transition",
  accent:
    "group relative inline-flex items-center justify-center rounded-full bg-accent/10 p-1.5 text-accent transition hover:bg-accent/20",
  danger:
    "group relative inline-flex items-center justify-center rounded-full bg-danger/10 p-1.5 text-danger transition hover:bg-danger/20",
  accent2:
    "group relative inline-flex items-center justify-center rounded-full bg-accent-2/10 p-1.5 text-accent-2 transition hover:bg-accent-2/20",
};

// `card-surface` supplies the hover border sweep used elsewhere on the site;
// its `overflow: hidden` is overridden so the icon tooltips can escape the pill.
const GROUP_CLASS = "card-surface !overflow-visible flex items-center rounded-full px-3 h-9";

// Pure-CSS hover/focus popup naming whichever footer icon is under the
// cursor — `group` on the anchor drives the tooltip's opacity/scale so no
// hover-state JS is needed.
function FooterIconLink({ href, onClick, label, external = true, tone = "default", children }: FooterIconLinkProps) {
  const Tag = href ? "a" : "button";
  const props = href
    ? { href, ...(external ? { target: "_blank", rel: "noreferrer" } : {}) }
    : { type: "button" as const, onClick };
  return (
    <Tag {...props} aria-label={label} className={TONE_CLASSES[tone]}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 scale-95 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-sans text-text opacity-0 shadow-lg transition duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
      >
        {label}
      </span>
    </Tag>
  );
}

/** The site's branch, with its latest commit in a hover popup (the same
 * pure-CSS tooltip pattern as the footer icons). The commit is fetched from
 * GitHub and re-checked every minute, so it follows pushes made after the deploy;
 * until the first answer it shows the commit this build was made from. */
function BranchBadge() {
  const { ui } = useContent();
  const { locale } = useLocale();
  useClock(); // re-renders each minute so the commit's age stays current
  const { branch } = BUILD_INFO;
  const { value: commit } = useLiveSource(latestCommitSource());
  const { sha, date, message } = commit ?? { sha: null, date: null, message: null };
  const label = (
    <>
      <GitBranch size={12} /> {branch ?? "main"}
    </>
  );
  if (!sha) return <span className="inline-flex items-center gap-1.5 text-accent">{label}</span>;

  return (
    <a
      href={`${SITE_REPO_URL}/commit/${sha}`}
      target="_blank"
      rel="noreferrer"
      className="group relative inline-flex items-center gap-1.5 text-accent"
    >
      {label}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-[min(20rem,calc(100vw-3rem))] -translate-x-1/2 scale-95 rounded-md border border-border bg-surface px-2.5 py-1.5 text-left text-[11px] text-text opacity-0 shadow-lg transition duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 sm:left-0 sm:translate-x-0"
      >
        <span className="block text-muted">{ui.labels.lastCommit}</span>
        <span className="block">
          <span className="text-accent">{sha.slice(0, 7)}</span>
          {date && ` · ${relativeTime(date, getLocaleMeta(locale).bcp47)}`}
        </span>
        {message && <span className="block truncate text-muted">{message}</span>}
      </span>
    </a>
  );
}

export function Footer() {
  const { profile, socials, ui } = useContent();
  const hasResume = profile.resumeUrl && profile.resumeUrl !== "#";

  return (
    <footer className="border-t border-border bg-surface-2">
      <div className="max-w-6xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-muted">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <BranchBadge />
          <span className="hidden sm:inline text-border">|</span>
          <span>UTF-8</span>
          <span className="hidden sm:inline text-border">|</span>
          <span>LF</span>
          <span className="hidden sm:inline text-border">|</span>
          <span className="inline-flex items-center gap-1.5 text-accent">
            <CheckCircle2 size={12} /> 0 problems
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} /> <LiveClock />
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
        </div>
        <div className="flex items-center gap-4 text-muted">
          <div role="group" aria-label={ui.labels.socialMedia} className={`${GROUP_CLASS} gap-4`}>
            <FooterIconLink href={socials.github} label="GitHub">
              <GithubIcon size={18} />
            </FooterIconLink>
            {socials.stackoverflow && (
              <FooterIconLink href={socials.stackoverflow} label="Stack Overflow">
                <StackOverflowIcon size={18} />
              </FooterIconLink>
            )}
            {socials.medium && (
              <FooterIconLink href={socials.medium} label="Medium">
                <MediumIcon size={18} />
              </FooterIconLink>
            )}
            <FooterIconLink href={socials.linkedin} label="LinkedIn">
              <LinkedinIcon size={18} />
            </FooterIconLink>
            {socials.telegram && (
              <FooterIconLink href={socials.telegram} label="Telegram">
                <TelegramIcon size={18} />
              </FooterIconLink>
            )}
            <FooterIconLink onClick={openContactModal} label={ui.labels.email}>
              <Mail size={18} />
            </FooterIconLink>
          </div>

          {hasResume && (
            <div role="group" aria-label={ui.labels.resume} className={GROUP_CLASS}>
              <FooterIconLink href={RESUME_HREF} label={ui.labels.resume} tone="accent" external={false}>
                <FileText size={16} />
              </FooterIconLink>
            </div>
          )}

          <div role="group" aria-label={ui.labels.projectLinks} className={`${GROUP_CLASS} gap-2`}>
            <FooterIconLink href={reportBugUrl()} label={ui.labels.reportBug} tone="danger">
              <Bug size={16} />
            </FooterIconLink>
            <FooterIconLink href={SITE_REPO_URL} label={ui.labels.viewSource} tone="accent2">
              <GithubIcon size={16} />
            </FooterIconLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

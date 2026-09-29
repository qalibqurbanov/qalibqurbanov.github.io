import { Bug, CheckCircle2, Clock, FileText, GitBranch, Mail } from "lucide-react";
import type { ReactNode } from "react";

import {
  GithubIcon,
  LinkedinIcon,
  MediumIcon,
  StackOverflowIcon,
  TelegramIcon,
} from "@/components/icons/BrandIcons";
import { useClock } from "@/hooks/useClock";
import { useContent, useLocale } from "@/i18n/context";
import { getLocaleMeta } from "@/i18n/locale";
import { reportBugUrl, SITE_REPO_URL } from "@/lib/githubIssue";

interface FooterIconLinkProps {
  href: string;
  label: string;
  external?: boolean;
  /** "danger" gives the icon its own soft red badge instead of the row's
   * plain muted-to-accent hover, so it reads as a distinct kind of action
   * (not another social link) without needing a divider next to it. */
  tone?: "default" | "danger";
  children: ReactNode;
}

// Pure-CSS hover/focus popup naming whichever footer icon is under the
// cursor — `group` on the anchor drives the tooltip's opacity/scale so no
// hover-state JS is needed.
function FooterIconLink({ href, label, external = true, tone = "default", children }: FooterIconLinkProps) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      aria-label={label}
      className={
        tone === "danger"
          ? "group relative inline-flex items-center justify-center rounded-full bg-danger/10 p-1.5 text-danger transition hover:bg-danger/20"
          : "group relative inline-flex items-center hover:text-accent transition"
      }
    >
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 scale-95 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-sans text-text opacity-0 shadow-lg transition duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
      >
        {label}
      </span>
    </a>
  );
}

export function Footer() {
  const { profile, socials } = useContent();
  const { locale } = useLocale();
  const now = useClock();
  const hasResume = profile.resumeUrl && profile.resumeUrl !== "#";

  const time = new Intl.DateTimeFormat(getLocaleMeta(locale).bcp47, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  return (
    <footer className="border-t border-border bg-surface-2">
      <div className="max-w-6xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-muted">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-accent">
            <GitBranch size={12} /> main
          </span>
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
            <Clock size={12} /> {time}
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
        </div>
        <div className="flex items-center gap-5 text-muted">
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
          <FooterIconLink href={socials.email} label="Email" external={false}>
            <Mail size={18} />
          </FooterIconLink>
          {hasResume && (
            <>
              <span className="h-4 w-px bg-border" aria-hidden="true" />
              <FooterIconLink href={profile.resumeUrl} label="Resume">
                <FileText size={18} />
              </FooterIconLink>
            </>
          )}
          <FooterIconLink href={reportBugUrl()} label="Report a bug" tone="danger">
            <Bug size={16} />
          </FooterIconLink>
          <FooterIconLink href={SITE_REPO_URL} label="View source on GitHub">
            <GithubIcon size={18} />
          </FooterIconLink>
        </div>
      </div>
    </footer>
  );
}

import { CheckCircle2, Clock, FileText, GitBranch, Mail } from "lucide-react";

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
          <a
            href={socials.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="hover:text-accent transition"
          >
            <GithubIcon size={18} />
          </a>
          {socials.stackoverflow && (
            <a
              href={socials.stackoverflow}
              target="_blank"
              rel="noreferrer"
              aria-label="Stack Overflow"
              className="hover:text-accent transition"
            >
              <StackOverflowIcon size={18} />
            </a>
          )}
          {socials.medium && (
            <a
              href={socials.medium}
              target="_blank"
              rel="noreferrer"
              aria-label="Medium"
              className="hover:text-accent transition"
            >
              <MediumIcon size={18} />
            </a>
          )}
          <a
            href={socials.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="hover:text-accent transition"
          >
            <LinkedinIcon size={18} />
          </a>
          {socials.telegram && (
            <a
              href={socials.telegram}
              target="_blank"
              rel="noreferrer"
              aria-label="Telegram"
              className="hover:text-accent transition"
            >
              <TelegramIcon size={18} />
            </a>
          )}
          <a href={socials.email} aria-label="Email" className="hover:text-accent transition">
            <Mail size={18} />
          </a>
          {hasResume && (
            <>
              <span className="h-4 w-px bg-border" aria-hidden="true" />
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Resume"
                className="hover:text-accent transition"
              >
                <FileText size={18} />
              </a>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}

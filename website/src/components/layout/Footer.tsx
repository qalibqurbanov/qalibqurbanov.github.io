import { GitBranch, Mail } from "lucide-react";

import { GithubIcon, LinkedinIcon } from "@/components/icons/BrandIcons";
import { useContent } from "@/i18n/context";

export function Footer() {
  const { profile, socials, ui } = useContent();

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
          <span>
            © {new Date().getFullYear()} {profile.name}. {ui.footer.builtWith}
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
          <a
            href={socials.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="hover:text-accent transition"
          >
            <LinkedinIcon size={18} />
          </a>
          <a href={socials.email} aria-label="Email" className="hover:text-accent transition">
            <Mail size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}

import { Briefcase, Bug, ChevronRight, Cpu, FileText, FolderGit2, House, Mail, PenLine, Send, User } from "lucide-react";
import type { ComponentType, CSSProperties, PointerEvent } from "react";
import { useEffect, useState } from "react";


import avatarUrl from "@/assets/avatar.webp";
import { openContactModal } from "@/components/contact/openContact";
import { GithubIcon, LinkedinIcon, MediumIcon, StackOverflowIcon, TelegramIcon } from "@/components/icons/BrandIcons";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { SettingsMenu } from "@/components/ui/SettingsMenu";
import { useClock } from "@/hooks/useClock";
import { usePage } from "@/hooks/usePage";
import { resumeHref } from "@/hooks/useProjectRoute";
import { useContent } from "@/i18n/context";
import { reportBugUrl, SITE_REPO_URL } from "@/lib/githubIssue";
import { useNotFound } from "@/lib/notFound";

import { Avatar } from "./Avatar";

/** One menu row is this tall (px) and rows are this far apart. */
const ROW = 34;
const GAP = 1;

const TOOL = "inline-flex h-7 w-7 cursor-pointer items-center justify-center text-muted transition-colors duration-200 hover:text-accent";

const ACTION =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition-colors duration-200 hover:border-accent/50 hover:text-text";

type Icon = ComponentType<{ size?: number; className?: string }>;

/** Each page has a small line icon of its own, in front of its name. */
const PAGE_ICONS: Record<string, Icon> = {
  "#home": House,
  "#about": User,
  "#experience": Briefcase,
  "#projects": FolderGit2,
  "#skills": Cpu,
  "#blog": PenLine,
  "#contact": Mail,
};

/** The fixed identity column of the desktop layout: my picture, name and title with the two ways to reach me,
 * the numbered pages, and the social links, all on one centre line, on a floating glass card. The card has film
 * grain, a comet of light that circles its rim, a glow that follows the pointer (rim and surface), and a quick lap
 * of light each time the page changes. The menu is plain: each page has a small icon, and the open page is brighter. */
export function Sidebar() {
  const { profile, navigation, socials, ui } = useContent();
  const page = usePage();
  const notFound = useNotFound();
  const hasResume = profile.resumeUrl && profile.resumeUrl !== "#";
  const now = useClock();
  const [lap, setLap] = useState(0);
  useEffect(() => setLap((value) => value + 1), [page]);

  // The glow under the pointer follows the pointer, on the card's surface and on its rim (--mx, --my). The card itself
  // does not move: it stays flat whatever the pointer does.
  const follow = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
    event.currentTarget.style.setProperty("--hover", "1");
  };
  const unfollow = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--hover", "0");
  };

  const links: { label: string; href: string; Icon: Icon }[] = [
    { label: "GitHub", href: socials.github, Icon: GithubIcon },
    { label: "LinkedIn", href: socials.linkedin, Icon: LinkedinIcon },
  ];
  if (socials.stackoverflow) links.push({ label: "Stack Overflow", href: socials.stackoverflow, Icon: StackOverflowIcon });
  if (socials.medium) links.push({ label: "Medium", href: socials.medium, Icon: MediumIcon });
  if (socials.telegram) links.push({ label: "Telegram", href: socials.telegram, Icon: TelegramIcon });

  return (
    <aside className="shell-side hidden p-3 lg:block">
    <div className="side-card flex h-full flex-col px-8 pb-4 pt-6 xl:px-10" onPointerMove={follow} onPointerLeave={unfollow}>
      <span className="card-mesh" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="card-rim" data-rim="comet" aria-hidden="true" />
      <span className="card-rim" data-rim="comet2" aria-hidden="true" />
      <span className="card-rim" data-rim="pointer" aria-hidden="true" />
      <span key={lap} className="card-rim" data-rim="pulse" aria-hidden="true" />
      <div className="flex flex-col items-center text-center">
        <a href="#links" aria-label={ui.links.title} className="rounded-full">
          <Avatar src={avatarUrl} alt={profile.name} />
        </a>
        <p aria-label={profile.name} className="text-flow mt-3 font-display text-2xl font-semibold leading-tight tracking-tight">
          <ScrambleText text={profile.name} playOnMount={false} duration={700} />
        </p>
        <p className="text-sweep mt-1.5 font-mono text-[11px] uppercase tracking-[0.18em]">{profile.headline}</p>
        <div className="mt-4 grid w-full max-w-60 grid-cols-2 gap-2">
          {hasResume && (
            <a href={resumeHref(page)} className={ACTION}>
              <FileText size={14} className="text-accent" aria-hidden="true" />
              {ui.labels.resume}
            </a>
          )}
          <button type="button" onClick={openContactModal} className={`${ACTION} ${hasResume ? "" : "col-span-2"}`}>
            <Send size={14} className="text-accent-2" aria-hidden="true" />
            {ui.labels.message}
          </button>
        </div>
      </div>

      {/* The menu sits in the middle of what is left between the identity above and the footer below. */}
      <div className="flex min-h-0 flex-1 items-center justify-center py-4">
      <nav aria-label={ui.nav.primary}>
        <ul className="flex flex-col" style={{ gap: GAP }}>
          {navigation.map((item, index) => {
            const on = !notFound && item.href === `#${page}`;
            const PageIcon = PAGE_ICONS[item.href] ?? House;
            return (
              <li key={item.href} className="rise" style={{ "--i": index } as CSSProperties}>
                <a
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  style={{ height: ROW }}
                  className={`group grid grid-cols-[1.75rem_1fr_1.75rem] items-center rounded-lg px-3 font-display text-[15px] transition-colors duration-300 ${on ? "text-accent" : "text-muted hover:text-accent-2"}`}
                >
                  <PageIcon size={16} className="transition-transform duration-300 group-hover:scale-110" />
                  <span className={`text-center ${on ? "font-semibold" : "font-medium"}`}>{item.label}</span>
                  {/* The open page has a lit cyan dot; a page that is pointed at gets an arrow that slides in. */}
                  <span className="relative flex h-full items-center justify-end" aria-hidden="true">
                    <span className={`absolute right-0.5 h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)] transition-all duration-300 ${on ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
                    {!on && <ChevronRight size={15} className="-translate-x-1.5 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      </div>

      <div className="flex flex-col gap-3">
        <ul aria-label={ui.labels.socialMedia} className="flex items-center justify-center gap-5">
          {links.map(({ label, href, Icon }) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className="text-muted transition-colors duration-200 hover:text-accent">
                <Icon size={17} />
              </a>
            </li>
          ))}
        </ul>

        {/* What used to be in the top bar and the footer: the copyright, the settings and the two links about the site itself. */}
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <p className="truncate text-[11px] text-muted">
            © {now.getFullYear()} {profile.name}
          </p>
          <div className="flex shrink-0 items-center">
            <a href={reportBugUrl()} target="_blank" rel="noreferrer" aria-label={ui.labels.reportBug} title={ui.labels.reportBug} className={`${TOOL} tool-danger`}>
              <Bug size={15} />
            </a>
            <a href={SITE_REPO_URL} target="_blank" rel="noreferrer" aria-label={ui.labels.viewSource} title={ui.labels.viewSource} className={`${TOOL} tool-green`}>
              <GithubIcon size={15} />
            </a>
            <SettingsMenu up />
          </div>
        </div>
      </div>
      <span className="card-glare" aria-hidden="true" />
      <span className="card-grain" aria-hidden="true" />
    </div>
    </aside>
  );
}

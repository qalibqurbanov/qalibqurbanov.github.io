import { Briefcase, Bug, Cpu, FileText, FolderGit2, House, Mail, PenLine, Send, User } from "lucide-react";
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
import { NavInk } from "./NavInk";

/** One menu row is this tall (px) and rows are this far apart. */
const ROW = 42;
const GAP = 6;

const TOOL = "inline-flex h-7 w-7 cursor-pointer items-center justify-center text-muted transition-colors duration-200 hover:text-accent";

/** The two buttons under the title: identical, flat and borderless. A faint tint of their colour (blue resume, purple message),
 * coloured text and icon, and a thin line under them that draws out to full width on hover. No frame, no glow, no lift. */
const ACTION =
  "tap group relative inline-flex h-10 cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md px-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-300 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-center after:scale-x-50 after:opacity-40 after:transition-all after:duration-500 after:ease-out hover:after:scale-x-100 hover:after:opacity-100";
const ACTION_BLUE = `${ACTION} bg-accent/8 text-accent after:bg-accent hover:bg-accent/14`;
const ACTION_PURPLE = `${ACTION} bg-accent-2/8 text-accent-2 after:bg-accent-2 hover:bg-accent-2/14`;
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
 * of light each time the page changes. Each page has a small icon, and the open page is brighter; a pen line is written beside the open page and the page that is pointed at (see NavInk). */
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
    <div className="side-card flex h-full flex-col px-6 pb-4 pt-6 xl:px-8" onPointerMove={follow} onPointerLeave={unfollow}>
      <span className="card-mesh" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="card-rim" data-rim="comet" aria-hidden="true" />
      <span className="card-rim" data-rim="comet2" aria-hidden="true" />
      <span className="card-rim" data-rim="pointer" aria-hidden="true" />
      <span key={lap} className="card-rim" data-rim="pulse" aria-hidden="true" />
      {/* Top: picture, name, title and the two buttons. */}
      <div className="flex flex-col items-center text-center">
        <a href="#links" aria-label={ui.links.title} className="rounded-full">
          <Avatar src={avatarUrl} alt={profile.name} />
        </a>
        <p aria-label={profile.name} className={`text-flow mt-3 font-display font-semibold text-3xl leading-tight tracking-tight`}>
          <ScrambleText text={profile.name} playOnMount={false} duration={700} />
        </p>
        <p className="text-sweep mt-1.5 font-mono text-[11px] uppercase tracking-[0.18em]">{profile.headline}</p>
        <div className="mt-5 grid w-full max-w-64 grid-cols-2 gap-2.5">
          {hasResume && (
            <a href={resumeHref(page)} className={ACTION_BLUE}>
              <FileText size={14} strokeWidth={1.75} aria-hidden="true" />
              {ui.labels.resume}
            </a>
          )}
          <button type="button" onClick={openContactModal} className={`${ACTION_PURPLE} ${hasResume ? "" : "col-span-2"}`}>
            <Send size={14} strokeWidth={1.75} aria-hidden="true" />
            {ui.labels.message}
          </button>
        </div>
      </div>

      {/* Middle: the menu, centred in the space between the top and the bottom. */}
      <div className="flex min-h-0 flex-1 items-center justify-center py-4">
      <nav aria-label={ui.nav.primary} className="w-full max-w-64">
        {/* A small caption over the list: just the word, centred. */}
        <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-muted" aria-hidden="true">
          {ui.nav.menu}
        </p>
        <ul className="nav-rail flex flex-col" style={{ gap: GAP }}>
          {navigation.map((item, index) => {
            const on = !notFound && item.href === `#${page}`;
            const PageIcon = PAGE_ICONS[item.href] ?? House;
            return (
              <li key={item.href} className="rise" style={{ "--i": index } as CSSProperties}>
                <a
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  style={{ height: ROW }}
                  className={`group relative grid grid-cols-[1.25rem_1fr] items-center gap-3 rounded-lg pl-2 pr-2 font-display text-[16px] transition-colors duration-300 ${on ? "text-accent" : "text-muted hover:text-accent-2"}`}
                >
                  <PageIcon size={16} className={`transition-all duration-300 group-hover:scale-110 ${on ? "drop-shadow-[0_0_6px_var(--color-accent)]" : ""}`} />
                  {/* The word, with the line that is written out beside it on the open page and on a page that is pointed at: one stroke that comes in from the right, goes round the word in a marker circle, runs on into a scribble, a loop and a tail, and ends in a small circle (open page) or an arrowhead (pointed at). */}
                  <span className={`nav-text relative text-left ${on ? "font-semibold" : "font-medium"}`}>
                    {item.label}
                    <NavInk index={index} />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      </div>

      {/* Bottom: the social links, with the footer row directly under them. */}
      <div className="flex flex-col gap-2">
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
        <span
          className="mt-1 block h-px w-full"
          style={{ backgroundImage: "linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 60%, transparent), color-mix(in srgb, var(--color-accent-2) 60%, transparent))" }}
          aria-hidden="true"
        />
        <div className="flex items-center justify-between gap-2">
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

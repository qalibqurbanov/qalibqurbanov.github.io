import { Briefcase, Bug, ChevronRight, Cpu, FolderGit2, House, Mail, PenLine, User } from "lucide-react";
import type { ComponentType, CSSProperties, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";


import avatarUrl from "@/assets/avatar.webp";
import { PILL_BLUE, PILL_PURPLE } from "@/components/ui/pill";
import { openContactModal } from "@/components/contact/openContact";
import { FileDrawIcon, SendDrawIcon } from "@/components/icons/DrawIcons";
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

/** How big everything in the card is, as a fraction of the size it was first drawn at (the picture, the name, the title, the buttons,
 * the menu and the spaces between them all follow it). Lower it to make the whole card's contents smaller. */
const SIZE = 0.88;

/** One menu row is this tall (rem) and rows are this far apart. */
const ROW = 2.25;
const GAP = 0.25;

const TOOL = "inline-flex h-7 w-7 cursor-pointer items-center justify-center text-muted transition-colors duration-200 hover:text-accent";

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
 * grain, a comet of light that circles its rim, and a quick lap
 * of light each time the page changes. Each page has a small icon, and the open page is brighter and has a blue circle on its right; a page that is pointed at gets a purple arrow there. */
export function Sidebar() {
  const { profile, navigation, socials, ui } = useContent();
  const page = usePage();
  const notFound = useNotFound();
  const hasResume = profile.resumeUrl && profile.resumeUrl !== "#";
  const now = useClock();
  const [lap, setLap] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => setLap((value) => value + 1), [page]);

  // The colour in the name, and in the title under it, is still until that line is pointed at. Then its blend slowly turns to a random
  // direction and drifts along the line, and when the pointer leaves it settles back to rest. How far it has turned and drifted is eased in
  // and out (about a second and a half each way), so it starts and ends softly and always comes to rest exactly where it began. The two
  // lines move on their own, each in its own random direction.
  const nameRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stops: (() => void)[] = [];
    for (const el of [nameRef.current, titleRef.current]) {
      if (!el) continue;
      const measure = () => {
        if (el.offsetWidth > 0) el.style.setProperty("--name-w", `${el.offsetWidth}px`);
      };
      measure();
      const sizeWatcher = new ResizeObserver(measure);
      sizeWatcher.observe(el);
      const SPEED = 0.5;
      let frame = 0;
      let last = 0;
      let amount = 0;
      let target = 0;
      let phase = 0;
      let turn = 0;
      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        amount += (target - amount) * (1 - Math.exp(-dt * 1.3));
        phase += dt * SPEED;
        if (target === 0 && amount < 0.002) {
          el.style.setProperty("--flow-f", "0");
          el.style.setProperty("--flow-ang", "90deg");
          frame = 0;
          return;
        }
        el.style.setProperty("--flow-f", (Math.sin(phase) * amount * 0.7).toFixed(4));
        el.style.setProperty("--flow-ang", `${(90 + amount * (turn + 18 * Math.sin(phase * 0.6))).toFixed(2)}deg`);
        frame = requestAnimationFrame(tick);
      };
      const enter = () => {
        target = 1;
        if (amount < 0.002) {
          phase = Math.random() * Math.PI * 2;
          turn = (Math.random() < 0.5 ? -1 : 1) * (45 + Math.random() * 75);
        }
        if (!frame) {
          last = performance.now();
          frame = requestAnimationFrame(tick);
        }
      };
      const leave = () => {
        target = 0;
      };
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
      stops.push(() => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
        cancelAnimationFrame(frame);
        sizeWatcher.disconnect();
      });
    }
    return () => stops.forEach((stop) => stop());
  }, []);

  // Two soft glows (cyan and magenta, the colours of the rings round my picture) wander through the letters of the name and of the title.
  // Each glow follows a smooth curve made of two slow waves per direction, with its own random speeds and starting points, so it is always
  // moving, never stops, never changes speed suddenly and never leaves the word; it drifts in a different direction every time, and the
  // two glows and the two texts all move independently.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wave = () => ({ f1: 0.34 + Math.random() * 0.4, f2: 0.7 + Math.random() * 0.5, p1: Math.random() * 6.28, p2: Math.random() * 6.28 });
    const at = (w: { f1: number; f2: number; p1: number; p2: number }, t: number) => 0.5 + 0.5 * (0.65 * Math.sin(w.f1 * t + w.p1) + 0.35 * Math.sin(w.f2 * t + w.p2));
    const stops: (() => void)[] = [];
    for (const el of [nameRef.current, titleRef.current]) {
      if (!el) continue;
      const glows = ["--g1", "--g2"].map((name) => ({ name, x: wave(), y: wave() }));
      let frame = 0;
      let last = performance.now();
      let t = 0;
      const tick = (now: number) => {
        t += Math.min(0.05, (now - last) / 1000);
        last = now;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        for (const g of glows) {
          el.style.setProperty(`${g.name}x`, `${(w * (0.04 + 0.92 * at(g.x, t))).toFixed(1)}px`);
          el.style.setProperty(`${g.name}y`, `${(h * (0.15 + 0.7 * at(g.y, t))).toFixed(1)}px`);
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      stops.push(() => cancelAnimationFrame(frame));
    }
    return () => stops.forEach((stop) => stop());
  }, []);

  // The whole card scales with the room it has: --s is 1 at the size it was drawn for (about 45rem tall and 24rem wide) and
  // smaller on a short window or a narrow column, so on a laptop nothing overlaps; on a large screen it grows a little.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const fit = () => {
      const { width, height } = card.getBoundingClientRect();
      // The page's own text size follows the window (see base.css), so the card is measured in those units: the same card at any screen size.
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const scale = Math.min(height / (45.3 * rem), width / (23.75 * rem)) * SIZE;
      card.style.setProperty("--s", Math.max(0.45, Math.min(1.1 * SIZE, scale)).toFixed(3));
    };
    fit();
    const watcher = new ResizeObserver(fit);
    watcher.observe(card);
    return () => watcher.disconnect();
  }, []);

  // While the pointer is over the card, the second comet on its rim fades in (--hover); it fades out when the pointer leaves.
  const follow = (event: PointerEvent<HTMLDivElement>) => {
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
    <div
      ref={cardRef}
      className="side-card flex h-full flex-col px-6 xl:px-8"
      style={{ paddingTop: "calc(1.5rem * var(--s, 1))", paddingBottom: "calc(1rem * var(--s, 1))" }}
      onPointerMove={follow}
      onPointerLeave={unfollow}
    >
      <span className="card-mesh" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="card-rim" data-rim="comet" aria-hidden="true" />
      <span className="card-rim" data-rim="comet2" aria-hidden="true" />
      <span key={lap} className="card-rim" data-rim="pulse" aria-hidden="true" />
      {/* Top: picture, name, title and the two buttons. */}
      <div className="flex flex-col items-center text-center">
        <a href="#links" aria-label={ui.links.title} className="rounded-full">
          <Avatar src={avatarUrl} alt={profile.name} />
        </a>
        <p
          ref={nameRef}
          aria-label={profile.name}
          className="name-tone font-display font-semibold leading-tight tracking-tight"
          style={{ marginTop: "calc(0.75rem * var(--s, 1))", fontSize: "calc(1.875rem * var(--s, 1))" }}
        >
          <ScrambleText text={profile.name} playOnMount={false} duration={700} />
        </p>
        <p ref={titleRef} className="title-tone font-mono text-[0.6875rem] uppercase tracking-[0.18em]" style={{ marginTop: "calc(0.375rem * var(--s, 1))" }}>{profile.headline}</p>
        <div className="grid w-full max-w-64 grid-cols-2 gap-2.5" style={{ marginTop: "calc(1.25rem * var(--s, 1))" }}>
          {hasResume && (
            <a href={resumeHref(page)} className={PILL_BLUE}>
              <FileDrawIcon />
              {ui.labels.resume}
            </a>
          )}
          <button type="button" onClick={openContactModal} className={`${PILL_PURPLE} ${hasResume ? "" : "col-span-2"}`}>
            <SendDrawIcon />
            {ui.labels.message}
          </button>
        </div>
      </div>

      {/* Middle: the menu, centred in the space between the top and the bottom. */}
      <div className="flex min-h-0 flex-1 items-center justify-center" style={{ paddingBlock: "calc(1rem * var(--s, 1))" }}>
      <nav aria-label={ui.nav.primary} className="w-full max-w-64">
        <ul className="nav-rail mx-auto flex w-max flex-col" style={{ gap: `calc(${GAP}rem * var(--s, 1))` }}>
          {navigation.map((item, index) => {
            const on = !notFound && item.href === `#${page}`;
            const PageIcon = PAGE_ICONS[item.href] ?? House;
            return (
              <li key={item.href} className="rise" style={{ "--i": index } as CSSProperties}>
                <a
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  style={{ height: `max(1.5rem, calc(${ROW}rem * var(--s, 1)))`, fontSize: "max(0.8rem, calc(1.04rem * var(--s, 1)))" }}
                  className={`group relative grid grid-cols-[1rem_1fr] items-center gap-3 rounded-lg pl-3 pr-3 font-display text-[1rem] transition-colors duration-300 ${on ? "text-accent" : "text-muted hover:text-accent-2"}`}
                >
                  {/* A thin bar on the left edge (half height when pointed at, full and glowing on the open page, in the row’s own colour),
                      and the page icon that slides away to leave a chevron in its place only while the row is pointed at. */}
                  <span className="nav-bar" aria-hidden="true" />
                  <span className="nav-ico" aria-hidden="true">
                    <PageIcon size={16} className="nav-ico-page" />
                    <ChevronRight size={16} strokeWidth={1.75} className="nav-ico-arrow" />
                  </span>
                  <span className={`text-left ${on ? "font-semibold" : "font-medium"}`}>{item.label}</span>
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
        <div className="flex items-center justify-between gap-2 mt-0.5 border-t border-border pt-1">
          <p className="truncate text-[0.6875rem] text-muted">
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

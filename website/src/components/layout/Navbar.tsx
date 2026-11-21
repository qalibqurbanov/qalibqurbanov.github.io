import { Bug, ChevronRight, House } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import { openContactModal } from "@/components/contact/openContact";
import { GithubIcon } from "@/components/icons/BrandIcons";
import { FileDrawIcon, MenuDrawIcon, SendDrawIcon } from "@/components/icons/DrawIcons";
import { PILL_BLUE, PILL_PURPLE } from "@/components/ui/pill";
import { SettingsMenu } from "@/components/ui/SettingsMenu";
import { usePage } from "@/hooks/usePage";
import { resumeHref } from "@/hooks/useProjectRoute";
import { useClock } from "@/hooks/useClock";
import { useContent } from "@/i18n/context";
import { reportBugUrl, SITE_REPO_URL } from "@/lib/githubIssue";
import { useNotFound } from "@/lib/notFound";

import { PAGE_ICONS, TOOL, useSocialLinks } from "./shared";

/** The top bar, for phones only: the name, the settings and the menu, and in the open menu the pages and the links
 * about the site. On a desktop the sidebar has all of it, so there is no bar. Its lower edge is a neon line. */
export function Navbar() {
  const [open, setOpen] = useState(false);
  // The sheet stays mounted while it plays its exit, so it can sink away as smoothly as it rose.
  const [mounted, setMounted] = useState(false);
  const { profile, navigation, ui } = useContent();
  const page = usePage();
  const notFound = useNotFound();
  const now = useClock();
  const links = useSocialLinks();
  const hasResume = profile.resumeUrl && profile.resumeUrl !== "#";

  useEffect(() => {
    if (open) return;
    const id = window.setTimeout(() => setMounted(false), 280);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`neon-b fixed left-0 right-0 top-0 lg:hidden ${open ? "z-[70]" : "z-50"} bg-bg/70 backdrop-blur-md`}>
      <nav className="flex h-14 items-center justify-between gap-4 px-5 sm:px-6">
        <a
          href="#"
          onClick={(event) => {
            setOpen(false);
            event.preventDefault();
            window.location.hash = "home";
            window.scrollTo({ top: 0, behavior: "auto" });
          }}
          className="tap text-base font-semibold tracking-tight text-text"
        >
          {profile.name}
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="tap icon-redraw inline-flex h-10 w-10 cursor-pointer items-center justify-center text-muted transition-colors hover:text-accent focus-visible:text-accent"
            onClick={() => {
              setMounted(true);
              setOpen((value) => !value);
            }}
            aria-label={ui.nav.toggleMenu}
            aria-expanded={open}
          >
            <MenuDrawIcon open={open} />
          </button>
        </div>
      </nav>

      {mounted && (
        <div data-state={open ? "open" : "closed"} className="menu-sheet h-[calc(100dvh-3.5rem)] bg-bg/60 p-3 backdrop-blur-md sm:p-4">
          {/* The same card as the left menu, for the phone: glass with grain, soft drifting colour and a comet round its rim; the two buttons,
              the pages with their icons, the social links, and the footer row with the settings. */}
          <div className="side-card flex h-full flex-col bg-bg! bg-none! px-5 py-5">
            <span className="card-rim" data-rim="comet" aria-hidden="true" />
            <span className="card-rim" data-rim="comet2" aria-hidden="true" />

            <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="menu-row grid shrink-0 grid-cols-2 gap-2" style={{ "--i": 0 } as CSSProperties}>
                {hasResume && (
                  <a href={resumeHref(page)} onClick={() => setOpen(false)} className={`${PILL_BLUE} h-9!`}>
                    <FileDrawIcon />
                    {ui.labels.resume}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openContactModal();
                  }}
                  className={`${PILL_PURPLE} h-9! ${hasResume ? "" : "col-span-2"}`}
                >
                  <SendDrawIcon />
                  {ui.labels.message}
                </button>
              </div>

              <nav aria-label={ui.nav.primary} className="flex flex-1 items-center py-4">
                <ul className="nav-rail flex w-full flex-col gap-0.5">
                  {navigation.map((item, index) => {
                    const on = !notFound && item.href === `#${page}`;
                    const PageIcon = PAGE_ICONS[item.href] ?? House;
                    return (
                      <li key={item.href} className="menu-row" style={{ "--i": index + 1 } as CSSProperties}>
                        <a
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={on ? "page" : undefined}
                          className={`group relative grid h-10 grid-cols-[1rem_1fr] items-center gap-3 rounded-lg pl-3 pr-3 font-display text-base transition-colors duration-300 ${on ? "text-accent" : "text-muted hover:text-accent-2"}`}
                        >
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

            <div className="menu-row mt-2 flex shrink-0 flex-col gap-2" style={{ "--i": navigation.length + 1 } as CSSProperties}>
              <ul aria-label={ui.labels.socialMedia} className="flex items-center justify-center gap-5">
                {links.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className="inline-flex h-8 w-8 items-center justify-center text-muted transition-colors duration-200 hover:text-accent">
                      <Icon size={17} />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5">
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
            <span className="card-grain" aria-hidden="true" />
          </div>
        </div>
      )}
    </header>
  );
}

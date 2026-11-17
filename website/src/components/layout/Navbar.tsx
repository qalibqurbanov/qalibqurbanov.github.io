import { Bug, X } from "lucide-react";
import { useEffect, useState } from "react";

import { GithubIcon } from "@/components/icons/BrandIcons";
import { SettingsMenu } from "@/components/ui/SettingsMenu";
import { usePage } from "@/hooks/usePage";
import { useContent } from "@/i18n/context";
import { reportBugUrl, SITE_REPO_URL } from "@/lib/githubIssue";
import { useNotFound } from "@/lib/notFound";

/** The top bar, for phones only: the name, the settings and the menu, and in the open menu the pages and the links
 * about the site. On a desktop the sidebar has all of it, so there is no bar. Its lower edge is a neon line. */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const { profile, navigation, ui } = useContent();
  const page = usePage();
  const notFound = useNotFound();

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
          <SettingsMenu />
          <button
            type="button"
            className="inline-flex h-9 cursor-pointer items-center rounded-md border border-border px-3.5 text-sm text-muted transition-colors hover:border-accent hover:text-text"
            onClick={() => setOpen((value) => !value)}
            aria-label={ui.nav.toggleMenu}
            aria-expanded={open}
          >
            {open ? <X size={15} /> : ui.nav.menu}
          </button>
        </div>
      </nav>

      {open && (
        <div className="menu-in h-[calc(100dvh-3.5rem)] overflow-y-auto bg-bg px-5 pb-10 pt-2 sm:px-6">
          <ul>
            {navigation.map((item, index) => (
              <li key={item.href} className="border-b border-border first:border-t">
                <a href={item.href} onClick={() => setOpen(false)} aria-current={!notFound && item.href === `#${page}` ? "page" : undefined} className="flex items-baseline gap-4 py-4">
                  <span className="w-6 font-mono text-xs text-accent">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-xl font-medium">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-5 text-xs text-muted">
            <a href={reportBugUrl()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-text">
              <Bug size={14} aria-hidden="true" />
              {ui.labels.reportBug}
            </a>
            <a href={SITE_REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-text">
              <GithubIcon size={14} />
              {ui.labels.viewSource}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

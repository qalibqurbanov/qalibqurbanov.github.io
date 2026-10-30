import { ArrowUp, ArrowUpRight, Bug, Check, FileText, Languages, Link2, Moon, Search, Sun } from "lucide-react";
import type { ComponentType, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { OPEN_COMMAND_PALETTE_EVENT } from "@/components/command-palette/openPalette";
import { GithubIcon } from "@/components/icons/BrandIcons";
import { useProjectRoute } from "@/hooks/useProjectRoute";
import { useContent, useLocale } from "@/i18n/context";
import { SUPPORTED_LOCALES } from "@/i18n/locale";
import { reportBugUrl, SITE_REPO_URL } from "@/lib/githubIssue";
import { scrollToTop } from "@/lib/scroll";
import { useTheme } from "@/themes/shared/colour/context";

/** How long the "Copied!" swap stays up before the menu auto-closes. */
const COPY_FEEDBACK_MS = 900;

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform);

interface MenuState {
  x: number;
  y: number;
  /** Set when the right-click landed inside a project card. */
  projectSlug: string | null;
  /** Nearest ancestor `<section id>` — used to build a link that opens
   * focused on that block (see useHashSectionFocus). */
  sectionId: string | null;
}

interface MenuItemProps {
  icon?: ComponentType<{ size?: number }>;
  label: string;
  /** Right-aligned keyboard hint, e.g. "Alt C". */
  hint?: string;
  /** Red instead of the accent — reserved for "Report a bug". */
  danger?: boolean;
  /** Lilac (accent-2) instead of the accent — reserved for "View source on GitHub",
   * matching its footer badge. */
  accent2?: boolean;
  onSelect: () => void;
}

function MenuItem({ icon: Icon, label, hint, danger, accent2, onSelect }: MenuItemProps) {
  const hover = danger
    ? "hover:bg-danger/10 focus-visible:bg-danger/10 hover:text-danger focus-visible:text-danger"
    : accent2
      ? "hover:bg-accent-2/10 focus-visible:bg-accent-2/10 hover:text-accent-2 focus-visible:text-accent-2"
      : "hover:bg-accent/10 focus-visible:bg-accent/10 hover:text-accent focus-visible:text-accent";
  const bar = danger ? "bg-danger" : accent2 ? "bg-accent-2" : "bg-accent";

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={onSelect}
      className={`group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-text outline-none transition-colors ${hover}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${bar}`}
      />
      {Icon && (
        <span className="text-muted transition-colors group-hover:text-current group-focus-visible:text-current">
          <Icon size={14} />
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
      {hint && (
        <kbd className="rounded border border-border bg-surface-2 px-1.5 py-px text-[10px] leading-4 text-muted">
          {hint}
        </kbd>
      )}
    </button>
  );
}

function MenuSeparator() {
  return <div role="separator" className="mx-1 my-1.5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />;
}

/** Right-click anywhere on the site opens this instead of the browser's
 * native menu — a small "editor command menu": a path-style header showing
 * where you clicked, project actions when the click landed on a project
 * card, site utilities (with shortcut hints and an inline language switcher),
 * the resume download as a highlighted action, and repo links last.
 * Arrow keys / Home / End move between items; Escape closes. */
export function ContextMenu() {
  const { ui, profile, projects } = useContent();
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const { openProject } = useProjectRoute();

  const [menu, setMenu] = useState<MenuState | null>(null);
  const [copiedKind, setCopiedKind] = useState<"repo" | "page" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<number | undefined>(undefined);

  function close() {
    setMenu(null);
  }

  useEffect(() => {
    function handleContextMenu(event: MouseEvent) {
      event.preventDefault();
      const target = event.target as HTMLElement;
      setMenu({
        x: event.clientX,
        y: event.clientY,
        projectSlug: target.closest<HTMLElement>("[data-project-slug]")?.dataset.projectSlug ?? null,
        sectionId: target.closest<HTMLElement>("section[id]")?.id ?? null,
      });
      setCopiedKind(null);
    }
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  // Dismiss on an outside click, Escape, or the page moving under the menu
  // (scroll/resize) — a stale menu floating over content that's scrolled
  // away looks broken.
  const menuOpen = menu !== null;
  useEffect(() => {
    if (!menuOpen) return;

    function dismiss() {
      setMenu(null);
    }
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) dismiss();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", dismiss);
      window.removeEventListener("resize", dismiss);
    };
  }, [menuOpen]);

  useEffect(() => {
    return () => window.clearTimeout(closeTimeout.current);
  }, []);

  // Keep the menu fully on-screen — measure it right after it mounts and
  // flip it to the other side of the cursor when it would overflow, so it
  // always grows away from the screen edge (and animates from that corner).
  const [placement, setPlacement] = useState({ top: 0, left: 0, origin: "top left" });
  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return;
    const { offsetWidth, offsetHeight } = menuRef.current;
    const margin = 8;
    const flipX = menu.x + offsetWidth + margin > window.innerWidth;
    const flipY = menu.y + offsetHeight + margin > window.innerHeight;
    setPlacement({
      left: Math.max(margin, flipX ? menu.x - offsetWidth : menu.x),
      top: Math.max(margin, flipY ? menu.y - offsetHeight : menu.y),
      origin: `${flipY ? "bottom" : "top"} ${flipX ? "right" : "left"}`,
    });
    menuRef.current.focus({ preventScroll: true });
  }, [menu]);

  if (!menu) return null;

  const project = menu.projectSlug ? (projects.find((item) => item.slug === menu.projectSlug) ?? null) : null;
  const where = project ? `projects/${project.slug}` : (menu.sectionId ?? "home");

  function copyThenClose(text: string, kind: "repo" | "page") {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKind(kind);
    window.clearTimeout(closeTimeout.current);
    closeTimeout.current = window.setTimeout(close, COPY_FEEDBACK_MS);
  }

  function downloadResume() {
    const link = document.createElement("a");
    link.href = profile.resumeUrl;
    link.download = "";
    link.click();
    close();
  }

  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End", "Tab"].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    let next: number;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else if (event.key === "ArrowUp" || (event.key === "Tab" && event.shiftKey)) {
      next = current <= 0 ? items.length - 1 : current - 1;
    } else next = current + 1 >= items.length ? 0 : current + 1;
    items[next].focus();
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      onKeyDown={handleMenuKeyDown}
      style={{ top: placement.top, left: placement.left, transformOrigin: placement.origin }}
      className="context-menu fixed z-[70] w-72 overflow-hidden rounded-xl border border-border bg-surface/90 font-mono text-xs shadow-2xl shadow-black/40 outline-none backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface-2/60 px-3.5 py-2.5 text-[11px] text-muted">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
        <span className="truncate">
          <span className="text-accent-2">~/</span>
          {where}
        </span>
      </div>

      <div className="p-1.5">
        {project && (
          <>
            <MenuItem
              icon={ArrowUpRight}
              label={ui.commandPalette.openCaseStudy}
              onSelect={() => {
                openProject(project.slug);
                close();
              }}
            />
            <MenuItem
              icon={GithubIcon}
              label={ui.projectDetail.viewRepo}
              onSelect={() => {
                window.open(project.repoUrl, "_blank", "noreferrer");
                close();
              }}
            />
            <MenuItem
              icon={copiedKind === "repo" ? Check : Link2}
              label={copiedKind === "repo" ? ui.contextMenu.repoLinkCopied : ui.contextMenu.copyRepoLink}
              onSelect={() => copyThenClose(project.repoUrl, "repo")}
            />
            <MenuSeparator />
          </>
        )}

        <MenuItem
          icon={Search}
          label={ui.contextMenu.openCommandPalette}
          hint={isMac ? "⌥ C" : "Alt C"}
          onSelect={() => {
            window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
            close();
          }}
        />
        <MenuItem
          icon={theme === "dark" ? Sun : Moon}
          label={ui.commandPalette.actionToggleTheme}
          hint={isMac ? "⌥ T" : "Alt T"}
          onSelect={() => {
            toggleTheme();
            close();
          }}
        />
        <MenuItem
          icon={ArrowUp}
          label={ui.backToTop}
          onSelect={() => {
            scrollToTop();
            close();
          }}
        />
        <MenuItem
          icon={copiedKind === "page" ? Check : Link2}
          label={copiedKind === "page" ? ui.contextMenu.pageLinkCopied : ui.contextMenu.copyPageLink}
          onSelect={() => {
            const url = `${window.location.origin}${window.location.pathname}${menu.sectionId ? `#${menu.sectionId}` : ""}`;
            copyThenClose(url, "page");
          }}
        />

        <div className="flex items-center gap-2.5 px-2.5 py-1.5">
          <span className="text-muted">
            <Languages size={14} />
          </span>
          <span className="flex-1 truncate text-text">{ui.commandPalette.groupLanguages}</span>
          <div role="group" className="flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5">
            {SUPPORTED_LOCALES.map((meta) => (
              <button
                key={meta.code}
                type="button"
                role="menuitem"
                tabIndex={-1}
                title={meta.nativeLabel}
                aria-current={locale === meta.code}
                onClick={() => {
                  setLocale(meta.code);
                  close();
                }}
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase outline-none transition-colors ${
                  locale === meta.code
                    ? "bg-accent text-bg"
                    : "text-muted hover:text-accent focus-visible:text-accent focus-visible:ring-1 focus-visible:ring-accent"
                }`}
              >
                {meta.code}
              </button>
            ))}
          </div>
        </div>

        <MenuSeparator />

        <button
          type="button"
          role="menuitem"
          tabIndex={-1}
          onClick={downloadResume}
          className="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-md border border-accent/30 bg-gradient-to-r from-accent/15 to-accent-2/10 px-2.5 py-2 text-left font-medium text-accent outline-none transition-all hover:border-accent/60 hover:from-accent/25 hover:to-accent-2/20 focus-visible:border-accent"
        >
          <FileText size={14} />
          <span className="flex-1 truncate">{ui.contextMenu.downloadResume}</span>
          <ArrowUp size={12} className="rotate-180 transition-transform group-hover:translate-y-0.5" />
        </button>

        <MenuSeparator />

        <MenuItem
          icon={Bug}
          label={ui.contextMenu.reportBug}
          danger
          onSelect={() => {
            window.open(reportBugUrl(), "_blank", "noreferrer");
            close();
          }}
        />
        <MenuItem
          icon={GithubIcon}
          label={ui.contextMenu.viewSourceOnGithub}
          accent2
          onSelect={() => {
            window.open(SITE_REPO_URL, "_blank", "noreferrer");
            close();
          }}
        />
      </div>
    </div>
  );
}

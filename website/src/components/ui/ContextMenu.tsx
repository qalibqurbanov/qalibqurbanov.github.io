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
import { useTheme } from "@/theme/context";

/** How long the "Copied!" swap stays up before the menu auto-closes. */
const COPY_FEEDBACK_MS = 900;

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform);

interface MenuState {
  x: number;
  y: number;
  /** Set when the right-click landed inside a project card. */
  projectSlug: string | null;
  /** Nearest ancestor `<section id>`, used to build a link that opens focused on that block. */
  sectionId: string | null;
}

interface MenuItemProps {
  icon?: ComponentType<{ size?: number }>;
  label: string;
  /** Right-aligned keyboard hint, e.g. "Alt C". */
  hint?: string;
  /** Red instead of cyan: reserved for "Report a bug". */
  danger?: boolean;
  /** Magenta instead of cyan. */
  accent2?: boolean;
  /** Green instead of cyan: reserved for "View source on GitHub". */
  green?: boolean;
  onSelect: () => void;
}

function MenuItem({ icon: Icon, label, hint, danger, accent2, green, onSelect }: MenuItemProps) {
  const tone = danger ? "ctx-danger" : green ? "ctx-green" : accent2 ? "ctx-magenta" : "";
  return (
    <button type="button" role="menuitem" tabIndex={-1} onClick={onSelect} className={`ctx-item ${tone}`}>
      {Icon && (
        <span className="ctx-icon">
          <Icon size={14} />
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
      {hint && <kbd className="ctx-kbd">{hint}</kbd>}
    </button>
  );
}

function MenuSeparator() {
  return <div role="separator" className="ctx-sep" />;
}

/** Right-click anywhere on the site opens this instead of the browser's own menu: a flat, sharp command list with a
 * neon edge. A path-style header shows where you clicked, then project actions when the click landed on a project
 * card, the site's utilities (with shortcut hints and a language switch), the résumé, and the repository links.
 * Arrow keys, Home and End move between items; Escape closes. */
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
      const target = event.target as HTMLElement;
      // Text fields keep the browser's menu (paste, spell check).
      if (target.closest('input, textarea, [contenteditable="true"]')) return;
      event.preventDefault();
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

  // Dismiss on an outside click, Escape, or the page moving under the menu.
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

  // Keep the menu fully on-screen: measure it right after it mounts and flip it to the other side of the pointer
  // when it would overflow, so it always opens away from the screen edge.
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

  const hasResume = profile.resumeUrl && profile.resumeUrl !== "#";

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      onKeyDown={handleMenuKeyDown}
      style={{ top: placement.top, left: placement.left, transformOrigin: placement.origin }}
      className="ctx-menu"
    >
      <div className="ctx-head">
        <span aria-hidden="true" className="ctx-dot" />
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
          <div role="group" className="flex gap-px border border-border bg-bg p-px">
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
                className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase outline-none transition-colors ${
                  locale === meta.code ? "bg-accent text-on-accent" : "text-muted hover:text-accent focus-visible:text-accent"
                }`}
              >
                {meta.code}
              </button>
            ))}
          </div>
        </div>

        {hasResume && (
          <>
            <MenuSeparator />
            <button type="button" role="menuitem" tabIndex={-1} onClick={downloadResume} className="ctx-primary">
              <FileText size={14} />
              <span className="flex-1 truncate">{ui.contextMenu.downloadResume}</span>
              <ArrowUp size={12} className="rotate-180" />
            </button>
          </>
        )}

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
          green
          onSelect={() => {
            window.open(SITE_REPO_URL, "_blank", "noreferrer");
            close();
          }}
        />
      </div>
    </div>
  );
}

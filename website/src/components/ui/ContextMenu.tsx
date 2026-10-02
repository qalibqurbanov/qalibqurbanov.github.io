import {
  ArrowUp,
  ArrowUpRight,
  Bug,
  Check,
  ChevronRight,
  FileText,
  Languages,
  Link2,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { OPEN_COMMAND_PALETTE_EVENT } from "@/components/command-palette/CommandPalette";
import { GithubIcon } from "@/components/icons/BrandIcons";
import { useProjectRoute } from "@/hooks/useProjectRoute";
import { useContent, useLocale } from "@/i18n/context";
import { SUPPORTED_LOCALES } from "@/i18n/locale";
import { reportBugUrl, SITE_REPO_URL } from "@/lib/githubIssue";
import { scrollToTop } from "@/lib/scroll";
import { useTheme } from "@/theme/context";

/** How long the "Copied!" swap stays up before the menu auto-closes. */
const COPY_FEEDBACK_MS = 900;

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
  active?: boolean;
  accent?: boolean;
  /** Red instead of the accent — reserved for "Report a bug". */
  danger?: boolean;
  /** Cyan (accent-2) instead of the accent — reserved for "View source on GitHub",
   * matching its footer badge. */
  accent2?: boolean;
  onSelect: () => void;
}

function MenuItem({ icon: Icon, label, active, accent, danger, accent2, onSelect }: MenuItemProps) {
  const tone = danger
    ? "text-danger font-medium hover:bg-danger/10"
    : accent
      ? "text-accent font-medium hover:bg-accent/10"
      : accent2
        ? "text-accent-2 font-medium hover:bg-accent-2/10"
        : `hover:bg-surface-2 hover:text-accent ${active ? "text-accent" : "text-text"}`;

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={`group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors ${tone}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100 ${
          danger ? "bg-danger" : accent2 ? "bg-accent-2" : "bg-accent"
        }`}
      />
      {Icon && <Icon size={14} />}
      <span className="flex-1 truncate">{label}</span>
      {active && <Check size={12} />}
    </button>
  );
}

function MenuSeparator() {
  return <div className="my-1.5 h-px bg-border" />;
}

/** Right-click anywhere on the site opens this instead of the browser's
 * native menu — styled to match the rest of the site's "code editor" chrome
 * (same panel treatment as the command palette). Contextual items (only
 * when the click landed on a project card) come first, then site utilities,
 * then the standalone resume download, then "View source" last. */
export function ContextMenu() {
  const { ui, profile, projects } = useContent();
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const { openProject } = useProjectRoute();

  const [menu, setMenu] = useState<MenuState | null>(null);
  const [langSubOpen, setLangSubOpen] = useState(false);
  const [copiedKind, setCopiedKind] = useState<"repo" | "page" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<number | undefined>(undefined);

  function close() {
    setMenu(null);
    setLangSubOpen(false);
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
      setLangSubOpen(false);
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

  // Keep the menu fully on-screen — clamp against its own measured size
  // right after it mounts/repositions, rather than guessing its dimensions.
  const [placement, setPlacement] = useState({ top: 0, left: 0 });
  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return;
    const { offsetWidth, offsetHeight } = menuRef.current;
    const margin = 8;
    setPlacement({
      left: Math.min(menu.x, window.innerWidth - offsetWidth - margin),
      top: Math.min(menu.y, window.innerHeight - offsetHeight - margin),
    });
  }, [menu]);

  if (!menu) return null;

  const project = menu.projectSlug ? (projects.find((item) => item.slug === menu.projectSlug) ?? null) : null;

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

  return (
    <div
      ref={menuRef}
      role="menu"
      style={{ top: placement.top, left: placement.left }}
      className="fixed z-[70] w-64 rounded-xl border border-border bg-surface p-1.5 font-mono text-xs shadow-2xl shadow-black/40 animate-popover-in"
    >
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
      <div className="relative" onMouseEnter={() => setLangSubOpen(true)} onMouseLeave={() => setLangSubOpen(false)}>
        <MenuItem icon={Languages} label={ui.commandPalette.groupLanguages} onSelect={() => setLangSubOpen((v) => !v)} />
        <span className="pointer-events-none absolute right-2.5 top-1.5 text-muted">
          <ChevronRight size={12} />
        </span>
        {langSubOpen && (
          <div className="absolute left-full top-0 ml-1 w-32 rounded-lg border border-border bg-surface p-1.5 shadow-xl shadow-black/30 animate-popover-in">
            {SUPPORTED_LOCALES.map((meta) => (
              <MenuItem
                key={meta.code}
                label={meta.nativeLabel}
                active={locale === meta.code}
                onSelect={() => {
                  setLocale(meta.code);
                  close();
                }}
              />
            ))}
          </div>
        )}
      </div>
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

      <MenuSeparator />
      <MenuItem icon={FileText} label={ui.contextMenu.downloadResume} accent onSelect={downloadResume} />
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
  );
}

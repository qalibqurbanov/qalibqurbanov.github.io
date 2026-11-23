import { ArrowUp, Bug, Check, FileText, Link2 } from "lucide-react";
import type { ComponentType, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { GithubIcon } from "@/components/icons/BrandIcons";
import { useContent } from "@/i18n/context";
import { reportBugUrl, SITE_REPO_URL } from "@/lib/githubIssue";

/** How long the "Copied!" swap stays up before the menu auto-closes. */
const COPY_FEEDBACK_MS = 900;

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
  /** Red instead of cyan: reserved for "Report a bug". */
  danger?: boolean;
  /** Green instead of cyan: reserved for "View source on GitHub". */
  green?: boolean;
  onSelect: () => void;
}

function MenuItem({ icon: Icon, label, danger, green, onSelect }: MenuItemProps) {
  const tone = danger ? "ctx-danger" : green ? "ctx-green" : "";
  return (
    <button type="button" role="menuitem" tabIndex={-1} onClick={onSelect} className={`ctx-item ${tone}`}>
      {Icon && (
        <span className="ctx-icon">
          <Icon size={14} />
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

function MenuSeparator() {
  return <div role="separator" className="ctx-sep" />;
}

/** Right-click anywhere on the site opens this instead of the browser's own menu: a flat, sharp list with a neon edge. A
 * path-style header shows where you clicked, then four actions: copy the page link, download the résumé, report a bug, and
 * view the source on GitHub. Arrow keys, Home and End move between items; Escape closes. */
export function ContextMenu() {
  const { ui, profile, projects } = useContent();

  const [menu, setMenu] = useState<MenuState | null>(null);
  const [copied, setCopied] = useState(false);
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
      setCopied(false);
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

  function copyThenClose(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
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
        <MenuItem
          icon={copied ? Check : Link2}
          label={copied ? ui.contextMenu.pageLinkCopied : ui.contextMenu.copyPageLink}
          onSelect={() => {
            const url = `${window.location.origin}${window.location.pathname}${menu.sectionId ? `#${menu.sectionId}` : ""}`;
            copyThenClose(url);
          }}
        />

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

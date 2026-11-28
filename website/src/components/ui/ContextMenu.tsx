import { ArrowUp, Bug, Check, Copy, ExternalLink, FileText, Link2, Quote, Search } from "lucide-react";
import type { ComponentType, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { openContactModalWithQuote } from "@/components/contact/openContact";
import { GithubIcon } from "@/components/icons/BrandIcons";
import { useContent, useLocale } from "@/i18n/context";
import type { Locale } from "@/i18n/locale";
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
  /** The address of the link under the pointer, if the right-click landed on one. */
  linkHref: string | null;
  /** The text the visitor had selected when they right-clicked. */
  selection: string;
  /** The open window (dialog) the right-click landed in, if any. The menu is placed inside it: an open window
   * ignores the pointer everywhere outside itself, closes when clicked outside and keeps focus within, so a
   * menu left outside it could not be used. */
  host: HTMLElement | null;
}

/** Which copy action was just done, so only that item shows the tick. */
type Copied = "page" | "link" | "selection" | null;

/** A search query longer than this is cut, so the address stays reasonable. */
const SEARCH_MAX = 200;

/** "Search on Google" opens Google's own site for the page's language, with its interface in that language. */
const GOOGLE: Record<Locale, { domain: string; hl: string }> = {
  en: { domain: "www.google.com", hl: "en" },
  az: { domain: "www.google.az", hl: "az" },
  ru: { domain: "www.google.ru", hl: "ru" },
};

/** A link's address for the header: the site's name (without "www.") and the rest of the address after it. An
 * email or phone link is shown whole, as its address. */
function splitAddress(href: string, isWeb: boolean, label: string): { host: string; rest: string } {
  if (!isWeb) return { host: label, rest: "" };
  try {
    const url = new URL(href);
    const rest = `${url.pathname}${url.search}${url.hash}`.replace(/\/$/, "");
    return { host: url.host.replace(/^www\./, ""), rest: decodeURI(rest) };
  } catch {
    return { host: label, rest: "" };
  }
}

function googleSearchUrl(text: string, locale: Locale): string {
  const { domain, hl } = GOOGLE[locale];
  return `https://${domain}/search?q=${encodeURIComponent(text.slice(0, SEARCH_MAX))}&hl=${hl}`;
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
          <Icon size={13} />
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

/** How fast a long link address runs along, in pixels a second. */
const TICKER_SPEED = 35;

/** The right-clicked link's address in the header. When it is too long for the menu it runs along like a ticker:
 * copies follow each other in a seamless loop, each followed by a small pink diamond, softly faded at both edges.
 * A short address simply sits still. */
function LinkTicker({ host, rest }: { host: string; rest: string }) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLSpanElement>(null);
  const [running, setRunning] = useState(false);
  const [distance, setDistance] = useState(0);

  // Runs only when the address does not fit.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;
    setRunning(text.offsetWidth > box.clientWidth);
  }, [host, rest]);

  // One loop moves by exactly the distance from the address to its copy (the address, the diamond and the gaps
  // around it), measured once both are laid out, so the loop has no seam.
  useLayoutEffect(() => {
    if (!running || !textRef.current || !copyRef.current) return;
    setDistance(copyRef.current.offsetLeft - textRef.current.offsetLeft);
  }, [running, host, rest]);

  const address = (
    <>
      <span className="ctx-target-host">{host}</span>
      {rest}
    </>
  );
  const separator = (
    <span className="ctx-ticker-sep" aria-hidden="true">
      ◆
    </span>
  );

  return (
    <span ref={boxRef} className="ctx-ticker" data-running={running ? "" : undefined}>
      <span
        className="ctx-ticker-track"
        style={
          distance
            ? ({ "--ticker-distance": `${distance}px`, "--ticker-time": `${Math.max(4, distance / TICKER_SPEED)}s` } as React.CSSProperties)
            : undefined
        }
        data-ready={distance ? "" : undefined}
      >
        <span ref={textRef} className="ctx-ticker-text">
          {address}
        </span>
        {running && (
          <>
            {separator}
            <span ref={copyRef} className="ctx-ticker-text" aria-hidden="true">
              {address}
            </span>
            {separator}
          </>
        )}
      </span>
    </span>
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
  const { locale } = useLocale();

  const [menu, setMenu] = useState<MenuState | null>(null);
  const [copied, setCopied] = useState<Copied>(null);
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
        linkHref: target.closest<HTMLAnchorElement>("a[href]")?.href ?? null,
        selection: window.getSelection()?.toString().trim() ?? "",
        host: target.closest<HTMLElement>('[role="dialog"]'),
      });
      setCopied(null);
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

  function copyThenClose(text: string, what: Exclude<Copied, null>) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(what);
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
  const { selection, linkHref } = menu;
  // A web address can open in a new tab; an email or phone link only offers its address to copy.
  const linkIsWeb = linkHref ? /^https?:/i.test(linkHref) : false;
  const linkText = linkHref?.replace(/^(mailto|tel):/i, "").split("?")[0] ?? "";
  const linkLabel = linkHref ? (linkIsWeb ? linkHref : decodeURIComponent(linkText)) : "";
  // Shown in the header as the link's target: the site's name stands out, the rest of the address is dimmer.
  const linkParts = linkHref ? splitAddress(linkHref, linkIsWeb, linkLabel) : null;

  function openInNewTab(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
    close();
  }

  // A window that has closed since the right-click takes the menu with it.
  if (menu.host && !menu.host.isConnected) return null;

  const content = (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      onKeyDown={handleMenuKeyDown}
      style={{ top: placement.top, left: placement.left, transformOrigin: placement.origin }}
      className="ctx-menu"
    >
      <div className="ctx-head">
        <div className="ctx-where">
          <span aria-hidden="true" className="ctx-dot" />
          <span className="truncate">
            <span className="text-accent-2">~/</span>
            {where}
          </span>
        </div>
        {/* On a link, the header goes on to where the link leads, so its two actions below clearly act on it. */}
        {linkParts && (
          <div className="ctx-target" title={linkLabel}>
            <LinkTicker host={linkParts.host} rest={linkParts.rest} />
          </div>
        )}
      </div>

      <div className="p-1">
        {selection && (
          <>
            <MenuItem
              icon={copied === "selection" ? Check : Copy}
              label={copied === "selection" ? ui.contextMenu.selectionCopied : ui.contextMenu.copySelection}
              onSelect={() => copyThenClose(selection, "selection")}
            />
            <MenuItem
              icon={Search}
              label={ui.contextMenu.searchGoogle}
              onSelect={() => openInNewTab(googleSearchUrl(selection, locale))}
            />
            <MenuItem
              icon={Quote}
              label={ui.contextMenu.quoteInMessage}
              onSelect={() => {
                openContactModalWithQuote(selection);
                close();
              }}
            />
            <MenuSeparator />
          </>
        )}

        {linkHref && (
          <>
            {linkIsWeb && <MenuItem icon={ExternalLink} label={ui.contextMenu.openInNewTab} onSelect={() => openInNewTab(linkHref)} />}
            <MenuItem
              icon={copied === "link" ? Check : Copy}
              label={copied === "link" ? ui.contextMenu.linkAddressCopied : ui.contextMenu.copyLinkAddress}
              onSelect={() => copyThenClose(linkIsWeb ? linkHref : decodeURIComponent(linkText), "link")}
            />
            <MenuSeparator />
          </>
        )}

        <MenuItem
          icon={copied === "page" ? Check : Link2}
          label={copied === "page" ? ui.contextMenu.pageLinkCopied : ui.contextMenu.copyPageLink}
          onSelect={() => {
            const url = `${window.location.origin}${window.location.pathname}${menu.sectionId ? `#${menu.sectionId}` : ""}`;
            copyThenClose(url, "page");
          }}
        />

        {hasResume && (
          <>
            <MenuSeparator />
            <button type="button" role="menuitem" tabIndex={-1} onClick={downloadResume} className="ctx-primary">
              <FileText size={13} />
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

  return menu.host ? createPortal(content, menu.host) : content;
}

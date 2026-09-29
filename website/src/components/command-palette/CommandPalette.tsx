import * as Dialog from "@radix-ui/react-dialog";
import {
  Briefcase,
  Bug,
  Code2,
  CornerDownLeft,
  FileText,
  FolderGit2,
  Globe,
  Home as HomeIcon,
  Mail,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  GithubIcon,
  LinkedinIcon,
  MediumIcon,
  StackOverflowIcon,
  TelegramIcon,
} from "@/components/icons/BrandIcons";
import { useProjectRoute } from "@/hooks/useProjectRoute";
import { useContent, useLocale } from "@/i18n/context";
import { SUPPORTED_LOCALES } from "@/i18n/locale";
import { reportBugUrl } from "@/lib/githubIssue";
import { scrollToTop } from "@/lib/scroll";
import { useTheme } from "@/theme/context";

/** Lets any UI element (e.g. the Navbar's ⌘K pill) open the palette without
 * prop-drilling open state through the tree — the palette itself owns the
 * only piece of state that matters (whether it's open). */
export const OPEN_COMMAND_PALETTE_EVENT = "portfolio:open-command-palette";

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  keywords?: string;
  icon: ReactNode;
  onSelect: () => void;
  /** Keep the palette open after selecting (e.g. to show "copied" feedback). */
  keepOpen?: boolean;
}

interface PaletteGroup {
  id: string;
  label: string;
  items: PaletteItem[];
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || Boolean(el?.isContentEditable);
}

export function CommandPalette() {
  const { profile, socials, navigation, about, experience, skills, projects, ui } = useContent();
  const { locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { activeSlug, openProject, closeProject } = useProjectRoute();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [emailCopied, setEmailCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setActiveIndex(0);
      setEmailCopied(false);
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        handleOpenChange(!open);
        return;
      }
      if (event.key === "/" && !isEditableTarget(event.target) && !open) {
        event.preventDefault();
        handleOpenChange(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleOpenChange]);

  useEffect(() => {
    function handleOpenRequest() {
      handleOpenChange(true);
    }
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenRequest);
    return () => window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenRequest);
  }, [handleOpenChange]);

  const goToHref = useCallback(
    (href: string) => {
      if (activeSlug) {
        closeProject();
        window.setTimeout(() => {
          window.location.hash = href;
        }, 50);
      } else {
        window.location.hash = href;
      }
    },
    [activeSlug, closeProject],
  );

  const groups = useMemo<PaletteGroup[]>(() => {
    const navKeywords: Record<string, string> = {
      "#about": about.highlights.map((item) => `${item.label} ${item.value}`).join(" "),
      "#contact": `${profile.email} ${socials.github} ${socials.linkedin}`,
    };

    const navigationItems: PaletteItem[] = [
      {
        id: "nav-home",
        label: "Home",
        icon: <HomeIcon size={16} />,
        onSelect: () => (activeSlug ? closeProject() : scrollToTop()),
      },
      ...navigation.map((item) => ({
        id: `nav-${item.href}`,
        label: item.label,
        keywords: navKeywords[item.href],
        icon: <FolderGit2 size={16} />,
        onSelect: () => goToHref(item.href),
      })),
    ];

    const experienceItems: PaletteItem[] = experience.map((item) => ({
      id: `experience-${item.role}-${item.org}`,
      label: `${item.role} — ${item.org}`,
      hint: item.period,
      keywords: item.tags.join(" "),
      icon: <Briefcase size={16} />,
      onSelect: () => goToHref("#experience"),
    }));

    const projectItems: PaletteItem[] = projects.map((project) => ({
      id: `project-${project.slug}`,
      label: project.title,
      hint: ui.commandPalette.openCaseStudy,
      keywords: [project.tags.join(" "), project.stack?.join(" ") ?? "", project.description].join(" "),
      icon: <FolderGit2 size={16} />,
      onSelect: () => openProject(project.slug),
    }));

    const skillItems: PaletteItem[] = (Object.keys(skills) as Array<keyof typeof skills>).flatMap(
      (category) =>
        skills[category].map((skill) => ({
          id: `skill-${category}-${skill}`,
          label: skill,
          hint: ui.skillGroups[category],
          keywords: category,
          icon: <Code2 size={16} />,
          onSelect: () => goToHref("#skills"),
        })),
    );

    const actionItems: PaletteItem[] = [
      {
        id: "action-theme",
        label: ui.commandPalette.actionToggleTheme,
        icon: theme === "dark" ? <Sun size={16} /> : <Moon size={16} />,
        onSelect: toggleTheme,
      },
      {
        id: "action-copy-email",
        label: emailCopied ? ui.commandPalette.actionEmailCopied : ui.commandPalette.actionCopyEmail,
        icon: <Mail size={16} />,
        keepOpen: true,
        onSelect: () => {
          navigator.clipboard.writeText(profile.email).catch(() => undefined);
          setEmailCopied(true);
          window.setTimeout(() => setEmailCopied(false), 1500);
        },
      },
      {
        id: "action-github",
        label: ui.commandPalette.actionOpenGithub,
        icon: <GithubIcon size={16} />,
        onSelect: () => window.open(socials.github, "_blank", "noreferrer"),
      },
      {
        id: "action-linkedin",
        label: ui.commandPalette.actionOpenLinkedin,
        icon: <LinkedinIcon size={16} />,
        onSelect: () => window.open(socials.linkedin, "_blank", "noreferrer"),
      },
      {
        id: "action-report-bug",
        label: ui.commandPalette.actionReportBug,
        icon: <Bug size={16} />,
        onSelect: () => window.open(reportBugUrl(), "_blank", "noreferrer"),
      },
    ];

    if (socials.telegram) {
      actionItems.push({
        id: "action-telegram",
        label: ui.commandPalette.actionOpenTelegram,
        icon: <TelegramIcon size={16} />,
        onSelect: () => window.open(socials.telegram, "_blank", "noreferrer"),
      });
    }

    if (socials.medium) {
      actionItems.push({
        id: "action-medium",
        label: ui.commandPalette.actionOpenMedium,
        icon: <MediumIcon size={16} />,
        onSelect: () => window.open(socials.medium, "_blank", "noreferrer"),
      });
    }

    if (socials.stackoverflow) {
      actionItems.push({
        id: "action-stackoverflow",
        label: ui.commandPalette.actionOpenStackOverflow,
        icon: <StackOverflowIcon size={16} />,
        onSelect: () => window.open(socials.stackoverflow, "_blank", "noreferrer"),
      });
    }

    if (profile.resumeUrl && profile.resumeUrl !== "#") {
      actionItems.splice(1, 0, {
        id: "action-resume",
        label: ui.commandPalette.actionOpenResume,
        keywords: "resume cv pdf",
        icon: <FileText size={16} />,
        onSelect: () => window.open(profile.resumeUrl, "_blank", "noreferrer"),
      });
    }

    const languageItems: PaletteItem[] = SUPPORTED_LOCALES.filter(
      (meta) => meta.code !== locale,
    ).map((meta) => ({
      id: `lang-${meta.code}`,
      label: `${meta.nativeLabel} — ${meta.label}`,
      icon: <Globe size={16} />,
      onSelect: () => setLocale(meta.code),
    }));

    return [
      { id: "navigation", label: ui.commandPalette.groupNavigation, items: navigationItems },
      { id: "experience", label: ui.commandPalette.groupExperience, items: experienceItems },
      { id: "projects", label: ui.commandPalette.groupProjects, items: projectItems },
      { id: "skills", label: ui.commandPalette.groupSkills, items: skillItems },
      { id: "actions", label: ui.commandPalette.groupActions, items: actionItems },
      { id: "languages", label: ui.commandPalette.groupLanguages, items: languageItems },
    ];
  }, [
    about.highlights,
    activeSlug,
    closeProject,
    emailCopied,
    experience,
    goToHref,
    locale,
    navigation,
    openProject,
    profile.email,
    profile.resumeUrl,
    projects,
    setLocale,
    skills,
    socials.github,
    socials.linkedin,
    socials.medium,
    socials.stackoverflow,
    socials.telegram,
    theme,
    toggleTheme,
    ui.commandPalette,
    ui.skillGroups,
  ]);

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          `${item.label} ${item.keywords ?? ""}`.toLowerCase().includes(needle),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  const flatItems = useMemo(() => filteredGroups.flatMap((group) => group.items), [filteredGroups]);

  function handleQueryChange(next: string) {
    setQuery(next);
    setActiveIndex(0);
  }

  function runItem(item: PaletteItem) {
    item.onSelect();
    if (!item.keepOpen) handleOpenChange(false);
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, flatItems.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = flatItems[activeIndex];
      if (item) runItem(item);
    }
  }

  let rowCursor = -1;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm command-dialog-overlay" />
        <Dialog.Content
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
          className="fixed left-1/2 top-24 z-[60] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/40 command-dialog-content"
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search for a section, project, or action.
          </Dialog.Description>

          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search size={16} className="text-muted shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={ui.commandPalette.placeholder}
              className="w-full bg-transparent font-mono text-sm text-text placeholder:text-muted outline-none selectable"
            />
          </div>

          <div className="custom-scrollbar max-h-80 overflow-y-auto p-2">
            {flatItems.length === 0 && (
              <p className="px-3 py-6 text-center font-mono text-sm text-muted">
                {ui.commandPalette.empty}
              </p>
            )}

            {filteredGroups.map((group) => (
              <div key={group.id} className="mb-2 last:mb-0">
                <p className="px-3 pb-1 pt-2 font-mono text-[11px] uppercase tracking-wide text-muted/70">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  rowCursor += 1;
                  const isActive = rowCursor === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => runItem(item)}
                      onMouseEnter={() => setActiveIndex(rowCursor)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-mono text-sm transition-colors ${
                        isActive ? "bg-surface-2 text-accent" : "text-text hover:bg-surface-2"
                      }`}
                    >
                      <span className="text-muted shrink-0">{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint && (
                        <span className="text-xs text-muted shrink-0">{item.hint}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-4 border-t border-border px-4 py-2 font-mono text-[11px] text-muted">
            <span className="inline-flex items-center gap-1">
              <CornerDownLeft size={12} /> select
            </span>
            <span>esc close</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** A small "⌘K" pill that opens the command palette from anywhere it's rendered. */
export function CommandPaletteTrigger({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
      aria-label={label}
      title={label}
      className="hidden md:inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-accent/60 hover:text-accent"
    >
      <Search size={12} />
      <span className="text-[10px]">⌘K</span>
    </button>
  );
}

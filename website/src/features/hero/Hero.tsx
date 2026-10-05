import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight, FileCode2, FileText, Mail, Plus, SquareTerminal, X } from "lucide-react";
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  GithubIcon,
  LinkedinIcon,
  MediumIcon,
  StackOverflowIcon,
  TelegramIcon,
} from "@/components/icons/BrandIcons";
import { openContactModal } from "@/components/contact/ContactModal";
import { FileIcon } from "@/components/ui/FileIcon";
import { TAB_BASE, TAB_IDLE } from "@/components/ui/tabStyles";
import { GlitchText } from "@/components/ui/GlitchText";
import { Knockable } from "@/components/ui/Knockable";
import { Reveal } from "@/components/ui/Reveal";
import { WindowControls } from "@/components/ui/WindowControls";
import { HeroMinimizedEasterEgg } from "@/features/hero/HeroMinimizedEasterEgg";
import { HeroBoot } from "@/features/hero/HeroBoot";
import { HeroBootAura } from "@/features/hero/HeroBootAura";
import type { MenuDef, MenuEntry } from "@/features/hero/HeroMenuBar";
import { HeroMenuBar } from "@/features/hero/HeroMenuBar";
import { HeroStatusBar } from "@/features/hero/HeroStatusBar";
import { HeroTerminal } from "@/features/hero/HeroTerminal";
import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";
import { reportBugUrl, SITE_REPO_URL } from "@/lib/githubIssue";
import { scrollToTop } from "@/lib/scroll";
import { useTheme, type Theme } from "@/theme/context";
import { useDraggableWindow } from "@/hooks/useDraggableWindow";
import { RESUME_HREF } from "@/hooks/useProjectRoute";
import { useInView } from "@/hooks/useInView";
import { useTilt } from "@/hooks/useTilt";

/** Start of a hero line's glitch-in entrance (see `.glitch-in`), timed to land as its fade-in does. */
const giDelay = (ms: number) => ({ "--gi-delay": `${ms}ms` }) as CSSProperties;

const TOTAL_CODE_LINES = 8;
const LINE_STEP_MS = 220;
/** Matches `.typewriter-line.is-revealed`'s CSS animation duration — once a
 * line has had time to finish wiping in, it's marked "settled" below. */
const TYPEWRITER_ANIMATION_MS = 420;

/** Splits text into words, each independently knockable, while leaving the
 * whitespace between them as plain text so the browser still wraps lines
 * normally. */
function BreakableWords({
  text,
  seedBase,
  wordClassName,
  glitchRange,
}: {
  text: string;
  seedBase: number;
  wordClassName?: string;
  /** Glitch each word at random on its own, this often (ms, shortest and longest). */
  glitchRange?: readonly [number, number];
}) {
  const tokens = text.split(/(\s+)/);
  let wordIndex = 0;

  return (
    <>
      {tokens.map((token, index) => {
        if (token === "") return null;
        if (/^\s+$/.test(token)) return <Fragment key={index}>{token}</Fragment>;

        const seed = seedBase + wordIndex;
        wordIndex += 1;
        return (
          <Knockable
            key={index}
            seed={seed}
            className={wordClassName ? `inline-block ${wordClassName}` : undefined}
          >
            {glitchRange ? <GlitchText text={token} idle idleRange={glitchRange} /> : token}
          </Knockable>
        );
      })}
    </>
  );
}

function CodeLine({
  n,
  revealed,
  settled,
  active = false,
  children,
}: {
  n: number;
  revealed: boolean;
  settled: boolean;
  /** The line the caret sits on: highlighted like an editor's current line. */
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`flex border-l-2 pl-[18px] pr-5 ${active ? "border-accent bg-accent/10" : "border-transparent"}`}>
      <span className="w-5 shrink-0 text-muted/50 select-none">{n}</span>
      <span
        className={`whitespace-pre-wrap inline-block typewriter-line ${
          settled ? "is-done" : revealed ? "is-revealed" : ""
        }`}
      >
        {children}
      </span>
    </div>
  );
}

function HeroCode({ started }: { started: boolean }) {
  const { profile, ui } = useContent();
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.4 });
  const [revealedCount, setRevealedCount] = useState(0);
  // Lags one animation-length behind `revealedCount`: a line stays on the
  // animated `is-revealed` class only long enough to actually play its wipe,
  // then switches to the static `is-done` end state. Without this, every
  // already-revealed line would still carry `is-revealed` indefinitely, and
  // switching tabs (which toggles this whole block to `display: none` and
  // back) restarts CSS animations on remount — replaying the entire
  // typewriter effect every time you tab back to it instead of just once.
  const [settledCount, setSettledCount] = useState(0);

  useEffect(() => {
    if (!started || !isInView || revealedCount >= TOTAL_CODE_LINES) return;
    const timer = window.setTimeout(() => setRevealedCount((count) => count + 1), LINE_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [started, isInView, revealedCount]);

  useEffect(() => {
    if (settledCount >= revealedCount) return;
    const timer = window.setTimeout(() => setSettledCount(revealedCount), TYPEWRITER_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [revealedCount, settledCount]);

  return (
    <div ref={ref} data-cursor="code" className="font-mono text-[13px] leading-7 py-5">
      <CodeLine n={1} revealed={revealedCount > 0} settled={settledCount > 0}>
        <span className="text-accent-2">public class</span> <span className="text-syn-type">Developer</span>
      </CodeLine>
      <CodeLine n={2} revealed={revealedCount > 1} settled={settledCount > 1}>
        <span className="bracket-0">{"{"}</span>
      </CodeLine>
      <CodeLine n={3} revealed={revealedCount > 2} settled={settledCount > 2}>
        <span className="text-accent-2 pl-4">public</span> <span className="text-syn-type">string</span>{" "}
        <span className="text-text">Name</span>{" "}
        <span className="text-muted">=</span> <span className="text-accent">"{profile.name}"</span>
        <span className="text-muted">;</span>
      </CodeLine>
      <CodeLine n={4} revealed={revealedCount > 3} settled={settledCount > 3}>
        <span className="text-accent-2 pl-4">public</span> <span className="text-syn-type">string</span>{" "}
        <span className="text-text">Role</span>{" "}
        <span className="text-muted">=</span> <span className="text-accent">"{profile.role}"</span>
        <span className="text-muted">;</span>
      </CodeLine>
      <CodeLine n={5} revealed={revealedCount > 4} settled={settledCount > 4}>
        <span className="text-accent-2 pl-4">public</span> <span className="text-syn-type">string</span>{" "}
        <span className="text-text">Location</span> <span className="text-muted">=</span>{" "}
        <span className="text-accent">"{profile.location}"</span>
        <span className="text-muted">;</span>
      </CodeLine>
      <CodeLine n={6} revealed={revealedCount > 5} settled={settledCount > 5}>
        <span className="text-accent-2 pl-4">public</span> <span className="text-syn-type">string[]</span>{" "}
        <span className="text-text">Stack</span>{" "}
        <span className="text-muted">=</span> <span className="bracket-1">{"{"}</span>{" "}
        <span className="text-accent">"{ui.hero.stackValue}"</span> <span className="bracket-1">{"}"}</span>
        <span className="text-muted">;</span>
      </CodeLine>
      <CodeLine n={7} revealed={revealedCount > 6} settled={settledCount > 6}>
        <span className="text-accent-2 pl-4">public</span> <span className="text-syn-type">bool</span>{" "}
        <span className="text-text">Hireable</span>{" "}
        <span className="text-muted">=</span> <span className="text-accent-2">true</span>
        <span className="text-muted">;</span>
      </CodeLine>
      <CodeLine n={8} revealed={revealedCount > 7} settled={settledCount > 7} active={revealedCount >= TOTAL_CODE_LINES}>
        <span className="bracket-0">{"}"}</span>
        {revealedCount >= TOTAL_CODE_LINES && <span className="caret ml-1" />}
      </CodeLine>
    </div>
  );
}

/** How long the FBI reveal stays up before it restores itself — also shown
 * in the reveal's own warning message, so the two can't drift apart. */
const FBI_RESTORE_SECONDS = 20;

interface TerminalTab {
  id: number;
  /** The command word last run in this terminal; shown in the tab's title. */
  lastCommand: string | null;
  /** A command the terminal runs as soon as it opens (from the menu bar's Help menu). */
  initialCommand?: string;
}

/** Most tabs open at once, Developer.cs included. Past what fits, the tab strip scrolls (see the arrows beside it). */
const MAX_TABS = 8;

/** How often the hero name glitches by itself: far more often than the small labels. */
const NAME_GLITCH_RANGE = [2200, 5200] as const;

/** How far one click on a tab-strip arrow scrolls it. */
const TAB_SCROLL_STEP = 140;
/** The active tab here has no border of its own: the sliding underline draws it. */
const HERO_TAB_ACTIVE = "bg-surface text-text border-transparent";
/** The window's panes are stacked in one grid cell; the shown one fades and
 * slides in while the one being left fades out (visibility flips at the end of
 * the fade, so a hidden pane stays unclickable and out of the tab order). */
const PANE = "col-start-1 row-start-1 transition-[opacity,transform,visibility] duration-200 ease-out";
const PANE_SHOWN = "visible translate-y-0 opacity-100";
const PANE_HIDDEN = "invisible translate-y-1.5 opacity-0 pointer-events-none";

/** How far in from the callout's left edge its arrow sits. */
const HINT_NOTCH = 20;

/** Props that make a tab close on a middle click, like in a browser (the mouse-down
 * is cancelled too, so Windows does not start its autoscroll). */
function closeOnMiddleClick(close: () => void) {
  return {
    onMouseDown: (event: ReactMouseEvent) => {
      if (event.button === 1) event.preventDefault();
    },
    onAuxClick: (event: ReactMouseEvent) => {
      if (event.button !== 1) return;
      event.preventDefault();
      close();
    },
  };
}

const EMPTY_ACTION =
  "group flex w-[19rem] items-center gap-3 whitespace-nowrap rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-left text-text transition duration-200 hover:-translate-y-px hover:border-accent/50 hover:bg-accent/5 hover:shadow-[0_8px_24px_-12px_var(--glow-accent)]";
const EMPTY_ACTION_ICON =
  "grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-bg text-muted transition-colors group-hover:border-accent/40 group-hover:text-accent";
const EMPTY_ACTION_ARROW =
  "ml-auto shrink-0 text-muted/60 transition duration-200 group-hover:translate-x-0.5 group-hover:text-accent";
const TAB_CLOSE =
  "mx-1 grid h-5 w-5 shrink-0 place-items-center rounded-md text-muted/70 outline-none transition duration-150 hover:bg-danger/15 hover:text-danger focus-visible:bg-danger/15 focus-visible:text-danger active:scale-90 disabled:pointer-events-none disabled:opacity-40";
const TAB_ARROW =
  "mx-0.5 grid h-6 w-6 shrink-0 self-center place-items-center rounded-md text-text/75 transition-colors hover:bg-surface/60 hover:text-accent disabled:pointer-events-none disabled:opacity-25";

export function Hero() {
  const { profile, socials, navigation, ui } = useContent();
  const { theme: siteTheme } = useTheme();
  // The hero window has its own theme, independent of the site's: it starts
  // out matching the site, then only the View menu, the status bar and the
  // `theme` command change it.
  const [theme, setTheme] = useState<Theme>(siteTheme);
  const toggleTheme = useCallback(() => setTheme((current) => (current === "dark" ? "light" : "dark")), []);
  const [taglineBefore, taglineAfter] = ui.hero.tagline.split("{highlight}");
  const { ref: tiltRef, handleMouseMove, handleMouseLeave } = useTilt<HTMLDivElement>();
  const [terminals, setTerminals] = useState<TerminalTab[]>([]);
  const [activeTab, setActiveTab] = useState<"code" | number | null>("code");
  // Developer.cs is a tab like any other: it can be closed, and the window can end up empty.
  const [codeOpen, setCodeOpen] = useState(true);
  const nextTerminalId = useRef(1);
  // The "+" callout stays until a terminal has been opened for the first time.
  const [hintDismissed, setHintDismissed] = useState(false);
  const plusRef = useRef<HTMLButtonElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabEdges, setTabEdges] = useState({ overflowing: false, atStart: true, atEnd: true });
  // Where the active tab sits inside the strip, for the sliding underline.
  const [underline, setUnderline] = useState<{ left: number; width: number } | null>(null);
  // Where the "+" button's centre is, from the window's left edge, so the
  // callout's arrow can point straight at it.
  const [plusX, setPlusX] = useState<number | null>(null);
  // The window boots on first load (see HeroBoot); the code tab types itself
  // out once that is over. Reduced motion skips the boot altogether.
  const [booted, setBooted] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const handleBooted = useCallback(() => setBooted(true), []);
  const noTabs = !codeOpen && terminals.length === 0;
  const tabCount = terminals.length + (codeOpen ? 1 : 0);
  const atTabLimit = tabCount >= MAX_TABS;
  // The "+" is pointed out until the first terminal has been opened, and again
  // whenever the window is left with nothing open.
  const pointAtPlus = booted && (!hintDismissed || noTabs);
  const [shaking, setShaking] = useState(false);
  // Holds which message to show — null while hidden, so the same shake/toast
  // machinery can display different text for the minimize button (a generic
  // "can't close it" joke) vs. the close button once the FBI reveal has
  // already been shown once (a "stop tinkering" callback instead).
  const [closeToast, setCloseToast] = useState<string | null>(null);
  // Once the FBI reveal has been triggered and auto-restored, the close
  // button stops re-triggering it and just does the same shake/toast as
  // the minimize button instead — the "secret" only gets shown once.
  const [fbiRevealed, setFbiRevealed] = useState(false);
  const [revealActive, setRevealActive] = useState(false);
  const [countdown, setCountdown] = useState(FBI_RESTORE_SECONDS);
  // Derived rather than its own state: the reveal is only actually visible
  // while its countdown hasn't run out yet, so there's no separate "restore"
  // action to wire up — it just stops being true on its own.
  const minimized = revealActive && countdown > 0;
  const shakeTimeout = useRef<number | undefined>(undefined);
  const toastTimeout = useRef<number | undefined>(undefined);
  const { windowRef, dragging, windowStyle, dragHandleProps } = useDraggableWindow<HTMLDivElement>("#top");

  useLayoutEffect(() => {
    const plus = plusRef.current;
    const win = windowRef.current;
    if (!plus || !win || !pointAtPlus) return;
    const measure = () => {
      // offsetLeft ignores the window's drag/tilt transforms, unlike client rects.
      let x = plus.offsetWidth / 2;
      for (let el: HTMLElement | null = plus; el && el !== win; el = el.offsetParent as HTMLElement | null) {
        x += el.offsetLeft;
      }
      setPlusX(x);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(win);
    return () => observer.disconnect();
  }, [windowRef, pointAtPlus, codeOpen]);

  // Tracks whether the terminal tabs overflow their strip, and which end they are scrolled to.
  useLayoutEffect(() => {
    const strip = tabsRef.current;
    if (!strip) return;
    const update = () => {
      const overflowing = strip.scrollWidth > strip.clientWidth + 1;
      const atStart = strip.scrollLeft <= 1;
      const atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 1;
      setTabEdges((prev) =>
        prev.overflowing === overflowing && prev.atStart === atStart && prev.atEnd === atEnd
          ? prev
          : { overflowing, atStart, atEnd },
      );
    };
    update();
    strip.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(strip);
    return () => {
      strip.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [tabCount]);

  // Keeps the active tab in view, e.g. a new one past the right edge.
  useEffect(() => {
    const strip = tabsRef.current;
    if (!strip || activeTab === null) return;
    const tab = strip.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
    if (!tab) return;
    const right = tab.offsetLeft + tab.offsetWidth;
    if (tab.offsetLeft < strip.scrollLeft) strip.scrollTo({ left: tab.offsetLeft, behavior: "smooth" });
    else if (right > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: right - strip.clientWidth, behavior: "smooth" });
    }
  }, [activeTab, tabCount, tabEdges.overflowing]);

  // Follows the active tab: when it changes, and when its width (a new title)
  // or its position (tabs opened or closed before it) changes.
  useLayoutEffect(() => {
    const strip = tabsRef.current;
    const tab = activeTab === null ? null : strip?.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
    if (!strip || !tab) {
      setUnderline(null);
      return;
    }
    const measure = () =>
      setUnderline((prev) =>
        prev && prev.left === tab.offsetLeft && prev.width === tab.offsetWidth
          ? prev
          : { left: tab.offsetLeft, width: tab.offsetWidth },
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(tab);
    return () => observer.disconnect();
  }, [activeTab, tabCount]);

  function scrollTabs(direction: -1 | 1) {
    tabsRef.current?.scrollBy({ left: direction * TAB_SCROLL_STEP, behavior: "smooth" });
  }

  function openTerminal(initialCommand?: string) {
    if (atTabLimit) return;
    const id = nextTerminalId.current++;
    setTerminals((current) => [...current, { id, lastCommand: null, initialCommand }]);
    setActiveTab(id);
    setHintDismissed(true);
  }

  function closeTerminal(id: number) {
    const index = terminals.findIndex((terminal) => terminal.id === id);
    setTerminals((current) => current.filter((terminal) => terminal.id !== id));
    if (activeTab === id) {
      setActiveTab(terminals[index + 1]?.id ?? terminals[index - 1]?.id ?? (codeOpen ? "code" : null));
    }
  }

  function closeCode() {
    setCodeOpen(false);
    if (activeTab === "code") setActiveTab(terminals[0]?.id ?? null);
  }

  function reopenCode() {
    setCodeOpen(true);
    setActiveTab("code");
  }

  function closeActiveTab() {
    if (activeTab === "code") closeCode();
    else if (activeTab !== null) closeTerminal(activeTab);
  }

  function closeAllTabs() {
    setTerminals([]);
    setCodeOpen(false);
    setActiveTab(null);
  }

  function setLastCommand(id: number, name: string) {
    setTerminals((current) =>
      current.map((terminal) => (terminal.id === id ? { ...terminal, lastCommand: name } : terminal)),
    );
  }

  const openLink = (url: string) => window.open(url, "_blank", "noreferrer");
  const { menuBar, statusBar } = ui.hero;

  const activeTerminal = typeof activeTab === "number" ? terminals.find((terminal) => terminal.id === activeTab) : undefined;
  const terminalTitle = (terminal: TerminalTab) =>
    terminal.lastCommand ? `${ui.hero.terminalTabLabel} - ${terminal.lastCommand}` : ui.hero.terminalTabLabel;
  // The Go menu lists the open tabs, in the order the tab strip shows them.
  const openTabEntries: MenuEntry[] = noTabs
    ? []
    : [
        { type: "heading", label: menuBar.openTabs },
        ...(codeOpen
          ? [{ type: "item" as const, label: "Developer.cs", checked: activeTab === "code", onSelect: () => setActiveTab("code") }]
          : []),
        ...terminals.map((terminal) => ({
          type: "item" as const,
          label: terminalTitle(terminal),
          checked: activeTab === terminal.id,
          onSelect: () => setActiveTab(terminal.id),
        })),
        { type: "separator" },
      ];

  const menus: MenuDef[] = [
    {
      id: "file",
      label: menuBar.file,
      entries: [
        { type: "item", label: ui.hero.newTerminal, onSelect: () => openTerminal(), disabled: atTabLimit },
        { type: "item", label: ui.hero.reopenCode, onSelect: reopenCode, disabled: codeOpen || atTabLimit },
        { type: "separator" },
        { type: "item", label: menuBar.closeTab, onSelect: closeActiveTab, disabled: activeTab === null },
        { type: "item", label: menuBar.closeAllTabs, onSelect: closeAllTabs, disabled: noTabs },
      ],
    },
    {
      id: "view",
      label: menuBar.view,
      entries: [
        { type: "item", label: ui.terminal.menu.items.theme, onSelect: toggleTheme },
      ],
    },
    {
      id: "go",
      label: menuBar.go,
      entries: [
        ...openTabEntries,
        { type: "item", label: ui.labels.home, onSelect: scrollToTop },
        { type: "separator" },
        ...navigation.map((item) => ({
          type: "item" as const,
          label: item.label,
          onSelect: () => {
            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            document.querySelector(item.href)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
          },
        })),
      ],
    },
    {
      id: "links",
      label: menuBar.links,
      entries: [
        { type: "item", label: "GitHub", onSelect: () => openLink(socials.github) },
        { type: "item", label: "LinkedIn", onSelect: () => openLink(socials.linkedin) },
        ...(socials.telegram ? [{ type: "item" as const, label: "Telegram", onSelect: () => openLink(socials.telegram!) }] : []),
        ...(socials.medium ? [{ type: "item" as const, label: "Medium", onSelect: () => openLink(socials.medium!) }] : []),
        ...(socials.stackoverflow
          ? [{ type: "item" as const, label: "Stack Overflow", onSelect: () => openLink(socials.stackoverflow!) }]
          : []),
        { type: "separator" },
        { type: "item", label: ui.labels.email, onSelect: () => (window.location.href = `mailto:${profile.email}`) },
      ],
    },
    {
      id: "help",
      label: menuBar.help,
      entries: [
        { type: "item", label: menuBar.terminalCommands, onSelect: () => openTerminal("help"), disabled: atTabLimit },
        { type: "item", label: menuBar.interactiveMenu, onSelect: () => openTerminal("menu"), disabled: atTabLimit },
        { type: "separator" },
        { type: "item", label: ui.labels.viewSource, onSelect: () => openLink(SITE_REPO_URL) },
        { type: "item", label: ui.labels.reportBug, onSelect: () => openLink(reportBugUrl()) },
      ],
    },
  ];


  // The tilt effect rotates toward the cursor relative to the card's own small
  // rect; while dragging, the cursor roams the whole section, which would send
  // that rotation to wild angles. Hold it neutral for the duration of the drag.
  useEffect(() => {
    if (dragging) handleMouseLeave();
  }, [dragging, handleMouseLeave]);

  useEffect(() => {
    return () => {
      window.clearTimeout(shakeTimeout.current);
      window.clearTimeout(toastTimeout.current);
    };
  }, []);

  // Ticks the FBI reveal's countdown down once a second while it's showing
  // (each tick just schedules the next one); `minimized` above already goes
  // false on its own once countdown hits zero, so there's nothing else to
  // restore here.
  useEffect(() => {
    if (!minimized) return;
    const id = window.setTimeout(() => setCountdown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(id);
  }, [minimized, countdown]);

  // Shakes the window and pops up `message`, restarting the shake even if
  // it's already mid-animation. Used both by the minimize button (a generic
  // "can't close it" joke) and by the close button once the FBI reveal has
  // already been shown once (a different, "stop tinkering" message).
  function shakeWithMessage(message: string) {
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
    window.clearTimeout(shakeTimeout.current);
    shakeTimeout.current = window.setTimeout(() => setShaking(false), 500);

    setCloseToast(message);
    window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setCloseToast(null), 2200);
  }

  // First close click reveals the FBI easter egg and starts its countdown
  // (the effect above ticks it down and auto-restores at zero); every click
  // after that just shakes the window with a "stop tinkering" message.
  function handleCloseClick() {
    if (fbiRevealed) {
      shakeWithMessage(ui.hero.tinkerWarning);
      return;
    }
    setFbiRevealed(true);
    setCountdown(FBI_RESTORE_SECONDS);
    setRevealActive(true);
  }


  return (
    <section id="top" className="relative min-h-screen flex items-center bg-grid overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/4 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-accent/15 blur-3xl blob-drift-a" />
      <div className="pointer-events-none absolute top-1/3 right-0 w-[420px] h-[420px] rounded-full bg-accent-2/10 blur-3xl blob-drift-b" />

      <div className="relative max-w-6xl mx-auto px-6 py-32 w-full grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-16 items-center">
        <div>
          <Reveal>
            <p className="glitch-in font-mono text-accent text-sm mb-4" style={giDelay(300)}>
              <BreakableWords text={ui.hero.greeting} seedBase={200} />
            </p>
          </Reveal>

          <Reveal delayMs={100}>
            <h1 className="glitch-in text-4xl sm:text-6xl font-bold tracking-tight leading-tight" style={giDelay(400)}>
              <BreakableWords text={profile.name} seedBase={220} wordClassName="text-gradient" glitchRange={NAME_GLITCH_RANGE} />
            </h1>
          </Reveal>

          <Reveal delayMs={200}>
            <h2 className="glitch-in text-2xl sm:text-4xl font-semibold text-muted mt-2" style={giDelay(500)}>
              <BreakableWords text={taglineBefore} seedBase={240} />
              <Knockable seed={260}>
                <GlitchText text={ui.hero.highlightWord} idle />
              </Knockable>
              <BreakableWords text={taglineAfter} seedBase={261} />
            </h2>
          </Reveal>

          <Reveal delayMs={300}>
            <p className="glitch-in max-w-xl text-muted mt-6 leading-relaxed" style={giDelay(600)}>
              <BreakableWords text={profile.summary} seedBase={280} />
            </p>
          </Reveal>

          <Reveal delayMs={400} className="flex flex-wrap items-center gap-4 mt-10">
            <Knockable seed={103} className="inline-flex items-center">
              <a
                href="#projects"
                className="inline-flex items-center justify-center btn-pulse btn-solid rounded-md px-6 py-3 bg-accent text-bg font-mono text-sm font-medium hover:brightness-110 transition"
              >
                {ui.hero.ctaViewWork}
              </a>
            </Knockable>
            <Knockable seed={104} className="inline-flex items-center">
              <a
                href="#contact"
                className="btn-pulse inline-flex items-center justify-center px-6 py-3 rounded-md border border-border font-mono text-sm text-text hover:border-accent hover:text-accent transition"
              >
                {ui.hero.ctaGetInTouch}
              </a>
            </Knockable>
          </Reveal>

          <Reveal delayMs={500} className="mt-12 flex flex-wrap items-center gap-3">
            <Knockable seed={116} className="inline-block">
              <div className="card-surface !overflow-visible inline-flex items-center gap-0.5 rounded-full p-1.5">
                <Knockable seed={110} className="inline-flex items-center">
                  <a
                    href={socials.github}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub"
                    className="inline-flex items-center justify-center p-2 rounded-full text-muted hover:text-accent hover:bg-surface-2 transition"
                  >
                    <GithubIcon size={19} />
                  </a>
                </Knockable>
                {socials.stackoverflow && (
                  <Knockable seed={111} className="inline-flex items-center">
                    <a
                      href={socials.stackoverflow}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Stack Overflow"
                      className="inline-flex items-center justify-center p-2 rounded-full text-muted hover:text-accent hover:bg-surface-2 transition"
                    >
                      <StackOverflowIcon size={19} />
                    </a>
                  </Knockable>
                )}
                {socials.medium && (
                  <Knockable seed={112} className="inline-flex items-center">
                    <a
                      href={socials.medium}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Medium"
                      className="inline-flex items-center justify-center p-2 rounded-full text-muted hover:text-accent hover:bg-surface-2 transition"
                    >
                      <MediumIcon size={19} />
                    </a>
                  </Knockable>
                )}
                <Knockable seed={113} className="inline-flex items-center">
                  <a
                    href={socials.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    className="inline-flex items-center justify-center p-2 rounded-full text-muted hover:text-accent hover:bg-surface-2 transition"
                  >
                    <LinkedinIcon size={19} />
                  </a>
                </Knockable>
                {socials.telegram && (
                  <Knockable seed={114} className="inline-flex items-center">
                    <a
                      href={socials.telegram}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Telegram"
                      className="inline-flex items-center justify-center p-2 rounded-full text-muted hover:text-accent hover:bg-surface-2 transition"
                    >
                      <TelegramIcon size={19} />
                    </a>
                  </Knockable>
                )}
                <Knockable seed={115} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={openContactModal}
                    aria-label={ui.labels.email}
                    className="inline-flex items-center justify-center p-2 rounded-full text-muted hover:text-accent hover:bg-surface-2 transition"
                  >
                    <Mail size={19} />
                  </button>
                </Knockable>
              </div>
            </Knockable>
            {profile.resumeUrl && profile.resumeUrl !== "#" && (
              <Knockable seed={117} className="inline-block">
                <div className="card-surface !overflow-visible inline-flex items-center rounded-full p-1.5">
                  <a
                    href={RESUME_HREF}
                    aria-label={ui.labels.resume}
                    className="inline-flex items-center justify-center p-2 rounded-full text-accent bg-accent/10 hover:bg-accent/20 transition"
                  >
                    <FileText size={19} />
                  </a>
                </div>
              </Knockable>
            )}
          </Reveal>
        </div>

        <Reveal delayMs={250} className="hidden lg:block animate-float-slow">
          <div
            ref={tiltRef}
            onMouseMove={dragging || !booted ? undefined : handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="glitch-in [--gi-delay:450ms] [--gi-duration:900ms] relative transition-transform duration-300 ease-out will-change-transform"
          >
            <HeroMinimizedEasterEgg visible={minimized} countdown={countdown} />
            {closeToast && (
              <div
                role="status"
                className="animate-popover-in absolute -top-3 right-4 z-10 -translate-y-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text shadow-xl shadow-black/30"
              >
                {closeToast}
                <span className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r border-border bg-surface" />
              </div>
            )}
            <div
              className={`transition-all duration-500 ease-in-out ${shaking ? "animate-window-shake" : ""} ${
                minimized ? "pointer-events-none -translate-y-3 scale-90 opacity-0" : "translate-y-0 scale-100 opacity-100"
              }`}
            >
              <div ref={windowRef} style={windowStyle} inert={!booted} className="relative">
                {pointAtPlus && plusX !== null && (
                  <div
                    role="note"
                    style={{ left: Math.max(0, plusX - HINT_NOTCH) }}
                    className="animate-popover-in pointer-events-none absolute bottom-full z-20 mb-3 flex select-none items-center gap-2 whitespace-nowrap rounded-lg border border-accent/40 bg-surface px-3 py-2 font-mono text-xs text-text shadow-xl shadow-black/30"
                  >
                    <ArrowDown size={13} strokeWidth={2.5} className="shrink-0 animate-bounce text-accent" />
                    {ui.hero.terminalHint}
                    <span
                      style={{ left: Math.min(plusX, HINT_NOTCH) - 6 }}
                      className="absolute -bottom-1.5 h-3 w-3 rotate-45 border-b border-r border-accent/40 bg-surface"
                    />
                  </div>
                )}
                <HeroBootAura active={!booted} />
                <div
                  data-theme={theme}
                  className="relative rounded-xl overflow-hidden border border-border bg-surface text-text shadow-2xl shadow-black/40"
                >
                  {/* The boot covers the title row too, so its text starts at the window's top edge. */}
                  {!booted && <HeroBoot onDone={handleBooted} />}
                  {/* While the window boots the title row (tabs and controls) keeps
                      its space but stays hidden, then fades in. */}
                  <div
                    {...dragHandleProps}
                    aria-hidden={!booted}
                    className={`flex items-stretch justify-between gap-4 pl-2 pr-1.5 bg-surface-2 border-b border-border touch-none transition-opacity duration-500 ${
                      booted ? "opacity-100" : "pointer-events-none opacity-0"
                    } ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                  >
                    <div className="flex min-w-0 flex-1 items-stretch -mb-px" role="tablist">
                      {tabEdges.overflowing && (
                        <button
                          type="button"
                          onClick={() => scrollTabs(-1)}
                          disabled={tabEdges.atStart}
                          aria-label={ui.hero.scrollTabsLeft}
                          title={ui.hero.scrollTabsLeft}
                          className={TAB_ARROW}
                        >
                          <ChevronLeft size={16} strokeWidth={2.25} />
                        </button>
                      )}
                      <div
                        ref={tabsRef}
                        className="relative flex min-w-0 items-stretch overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      >
                        {codeOpen && (
                          <div
                            data-tab="code"
                            {...closeOnMiddleClick(closeCode)}
                            className={`${TAB_BASE} shrink-0 ${activeTab === "code" ? HERO_TAB_ACTIVE : TAB_IDLE}`}
                          >
                            <button
                              type="button"
                              role="tab"
                              aria-selected={activeTab === "code"}
                              onClick={() => setActiveTab("code")}
                              disabled={!booted}
                              className="flex items-center gap-1.5 py-2 pl-3 pr-1 disabled:pointer-events-none"
                            >
                              <FileIcon />
                              Developer.cs
                            </button>
                            <button
                              type="button"
                              onClick={closeCode}
                              disabled={!booted}
                              aria-label={ui.hero.closeFile}
                              title={ui.hero.closeFile}
                              className={TAB_CLOSE}
                            >
                              <X size={12} strokeWidth={2.25} />
                            </button>
                          </div>
                        )}
                        {terminals.map((terminal) => {
                          const title = terminalTitle(terminal);
                          return (
                            <div
                              key={terminal.id}
                              data-tab={terminal.id}
                              {...closeOnMiddleClick(() => closeTerminal(terminal.id))}
                              className={`${TAB_BASE} shrink-0 ${activeTab === terminal.id ? HERO_TAB_ACTIVE : TAB_IDLE}`}
                            >
                              <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === terminal.id}
                                onClick={() => setActiveTab(terminal.id)}
                                className="flex items-center gap-1.5 py-2 pl-3 pr-1"
                              >
                                <SquareTerminal size={12} className="shrink-0" />
                                <span className="max-w-[10.5rem] truncate">{title}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => closeTerminal(terminal.id)}
                                aria-label={ui.hero.closeTerminal}
                                title={ui.hero.closeTerminal}
                                className={TAB_CLOSE}
                              >
                                <X size={12} strokeWidth={2.25} />
                              </button>
                            </div>
                          );
                        })}
                        {/* The accent underline is one element that glides to whichever tab is active. */}
                        <span
                          aria-hidden="true"
                          style={{ left: underline?.left ?? 0, width: underline?.width ?? 0 }}
                          className={`pointer-events-none absolute bottom-0 h-0.5 bg-accent transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                            underline ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </div>
                      {tabEdges.overflowing && (
                        <button
                          type="button"
                          onClick={() => scrollTabs(1)}
                          disabled={tabEdges.atEnd}
                          aria-label={ui.hero.scrollTabsRight}
                          title={ui.hero.scrollTabsRight}
                          className={TAB_ARROW}
                        >
                          <ChevronRight size={16} strokeWidth={2.25} />
                        </button>
                      )}
                      {!atTabLimit && (
                        <div className="ml-1 flex shrink-0 items-center">
                          <button
                            ref={plusRef}
                            type="button"
                            onClick={() => openTerminal()}
                            disabled={!booted}
                            aria-label={ui.hero.newTerminal}
                            title={ui.hero.newTerminal}
                            className={`grid h-6 w-6 place-items-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-30 ${
                              pointAtPlus
                                ? "plus-heartbeat bg-accent/10 text-accent"
                                : "text-muted hover:bg-surface/60 hover:text-accent"
                            }`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center py-1.5">
                      <WindowControls
                        onMinimize={booted ? () => shakeWithMessage(ui.hero.closeAttempt) : undefined}
                        onClose={booted ? handleCloseClick : undefined}
                      />
                    </div>
                  </div>
                  {/* Menu bar and status bar sit out the boot like the title row. */}
                  <div
                    inert={!booted}
                    className={`relative z-20 transition-opacity duration-500 ${booted ? "opacity-100" : "opacity-0"}`}
                  >
                    <HeroMenuBar menus={menus} label={menuBar.label} />
                  </div>
                  {/* Both stay mounted so switching tabs doesn't unmount/remount
                      either one — HeroCode's typewriter reveal would otherwise
                      replay from scratch every time you come back to it, and
                      HeroTerminal's command history would reset too. */}
                  {/* Stacked in one grid cell (hidden one is `invisible`, not
                      `display: none`) so the window is always as tall as the
                      taller pane and never resizes or shifts on tab switch. */}
                  <div className="relative grid">
                    {codeOpen && (
                      <div
                        className={`${PANE} animate-pane-in min-h-[292px] ${activeTab === "code" ? PANE_SHOWN : PANE_HIDDEN}`}
                        aria-hidden={activeTab !== "code"}
                      >
                        <HeroCode started={booted} />
                      </div>
                    )}
                    {noTabs && (
                      <div className="animate-popover-in relative col-start-1 row-start-1 flex min-h-[292px] flex-col items-center justify-center gap-5 overflow-hidden px-5 font-mono">
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl"
                        />
                        <p className="animate-float-slow relative flex items-center gap-3">
                          <span aria-hidden="true" className="text-gradient select-none text-5xl font-light leading-none">
                            {"{"}
                          </span>
                          <span className="text-sm text-text">{ui.hero.noTabs}</span>
                          <span aria-hidden="true" className="text-gradient select-none text-5xl font-light leading-none">
                            {"}"}
                          </span>
                        </p>
                        <div className="relative flex flex-col gap-2 text-xs">
                          <button type="button" onClick={reopenCode} className={EMPTY_ACTION}>
                            <span className={EMPTY_ACTION_ICON}>
                              <FileCode2 size={14} />
                            </span>
                            {ui.hero.reopenCode}
                            <ArrowRight size={14} className={EMPTY_ACTION_ARROW} />
                          </button>
                          <button type="button" onClick={() => openTerminal()} className={EMPTY_ACTION}>
                            <span className={EMPTY_ACTION_ICON}>
                              <SquareTerminal size={14} />
                            </span>
                            {ui.hero.emptyTerminal}
                            <ArrowRight size={14} className={EMPTY_ACTION_ARROW} />
                          </button>
                        </div>
                      </div>
                    )}
                    {terminals.map((terminal) => (
                      <div
                        key={terminal.id}
                        className={`${PANE} animate-pane-in ${activeTab === terminal.id ? PANE_SHOWN : PANE_HIDDEN}`}
                        aria-hidden={activeTab !== terminal.id}
                      >
                        <HeroTerminal
                          initialCommand={terminal.initialCommand}
                          theme={theme}
                          onToggleTheme={toggleTheme}
                          onCommand={(name) => setLastCommand(terminal.id, name)}
                        />
                      </div>
                    ))}
                  </div>
                  <div
                    inert={!booted}
                    className={`transition-opacity duration-500 ${booted ? "opacity-100" : "opacity-0"}`}
                  >
                    <HeroStatusBar
                      label={statusBar.label}
                      status={statusBar.ready}
                      tabs={format(statusBar.tabs, { count: String(tabCount) })}
                      mode={activeTab === "code" ? "C#" : activeTerminal ? statusBar.terminal : "—"}
                      theme={theme}
                      themeLabel={theme === "dark" ? ui.labels.switchToLight : ui.labels.switchToDark}
                      onToggleTheme={toggleTheme}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <a
        href="#about"
        aria-label={ui.nav.scrollToAbout}
        className="hidden sm:flex absolute bottom-10 left-1/2 -translate-x-1/2 text-muted hover:text-accent transition animate-bounce"
      >
        <ArrowDown size={22} />
      </a>
    </section>
  );
}

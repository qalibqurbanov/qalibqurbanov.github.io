import { ArrowDown, FileText, Mail, SquareTerminal } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Fragment, useEffect, useRef, useState } from "react";

import {
  GithubIcon,
  LinkedinIcon,
  MediumIcon,
  StackOverflowIcon,
  TelegramIcon,
} from "@/components/icons/BrandIcons";
import { openContactModal } from "@/components/contact/ContactModal";
import { FileIcon } from "@/components/ui/FileIcon";
import { GlitchText } from "@/components/ui/GlitchText";
import { Knockable } from "@/components/ui/Knockable";
import { Reveal } from "@/components/ui/Reveal";
import { WindowControls } from "@/components/ui/WindowControls";
import { HeroMinimizedEasterEgg } from "@/features/hero/HeroMinimizedEasterEgg";
import { HeroTerminal } from "@/features/hero/HeroTerminal";
import { useContent } from "@/i18n/context";
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
}: {
  text: string;
  seedBase: number;
  wordClassName?: string;
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
            {token}
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
  children,
}: {
  n: number;
  revealed: boolean;
  settled: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex px-5">
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

function HeroCode() {
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
    if (!isInView || revealedCount >= TOTAL_CODE_LINES) return;
    const timer = window.setTimeout(() => setRevealedCount((count) => count + 1), LINE_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [isInView, revealedCount]);

  useEffect(() => {
    if (settledCount >= revealedCount) return;
    const timer = window.setTimeout(() => setSettledCount(revealedCount), TYPEWRITER_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [revealedCount, settledCount]);

  return (
    <div ref={ref} className="font-mono text-[13px] leading-7 py-5">
      <CodeLine n={1} revealed={revealedCount > 0} settled={settledCount > 0}>
        <span className="text-accent-2">public class</span> <span className="text-text">Developer</span>
      </CodeLine>
      <CodeLine n={2} revealed={revealedCount > 1} settled={settledCount > 1}>
        <span className="text-muted">{"{"}</span>
      </CodeLine>
      <CodeLine n={3} revealed={revealedCount > 2} settled={settledCount > 2}>
        <span className="text-accent-2 pl-4">public string</span> <span className="text-text">Name</span>{" "}
        <span className="text-muted">=</span> <span className="text-accent">"{profile.name}"</span>
        <span className="text-muted">;</span>
      </CodeLine>
      <CodeLine n={4} revealed={revealedCount > 3} settled={settledCount > 3}>
        <span className="text-accent-2 pl-4">public string</span> <span className="text-text">Role</span>{" "}
        <span className="text-muted">=</span> <span className="text-accent">"{profile.role}"</span>
        <span className="text-muted">;</span>
      </CodeLine>
      <CodeLine n={5} revealed={revealedCount > 4} settled={settledCount > 4}>
        <span className="text-accent-2 pl-4">public string</span>{" "}
        <span className="text-text">Location</span> <span className="text-muted">=</span>{" "}
        <span className="text-accent">"{profile.location}"</span>
        <span className="text-muted">;</span>
      </CodeLine>
      <CodeLine n={6} revealed={revealedCount > 5} settled={settledCount > 5}>
        <span className="text-accent-2 pl-4">public string[]</span> <span className="text-text">Stack</span>{" "}
        <span className="text-muted">= {"{"}</span> <span className="text-accent">"{ui.hero.stackValue}"</span>
        <span className="text-muted"> {"}"};</span>
      </CodeLine>
      <CodeLine n={7} revealed={revealedCount > 6} settled={settledCount > 6}>
        <span className="text-accent-2 pl-4">public bool</span> <span className="text-text">Hireable</span>{" "}
        <span className="text-muted">=</span> <span className="text-accent-2">true</span>
        <span className="text-muted">;</span>
      </CodeLine>
      <CodeLine n={8} revealed={revealedCount > 7} settled={settledCount > 7}>
        <span className="text-muted">{"}"}</span>
        {revealedCount >= TOTAL_CODE_LINES && <span className="caret ml-1" />}
      </CodeLine>
    </div>
  );
}

/** How long the FBI reveal stays up before it restores itself — also shown
 * in the reveal's own warning message, so the two can't drift apart. */
const FBI_RESTORE_SECONDS = 20;

export function Hero() {
  const { profile, socials, ui } = useContent();
  const [taglineBefore, taglineAfter] = ui.hero.tagline.split("{highlight}");
  const { ref: tiltRef, handleMouseMove, handleMouseLeave } = useTilt<HTMLDivElement>();
  const [tab, setTab] = useState<"code" | "terminal">("code");
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
      <div className="pointer-events-none absolute -top-40 left-1/4 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-accent-2/15 blur-3xl blob-drift-a" />
      <div className="pointer-events-none absolute top-1/3 right-0 w-[420px] h-[420px] rounded-full bg-accent/10 blur-3xl blob-drift-b" />

      <div className="relative max-w-6xl mx-auto px-6 py-32 w-full grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-16 items-center">
        <div>
          <Reveal>
            <p className="glitch-in font-mono text-accent text-sm mb-4" style={giDelay(300)}>
              <BreakableWords text={ui.hero.greeting} seedBase={200} />
            </p>
          </Reveal>

          <Reveal delayMs={100}>
            <h1 className="glitch-in text-4xl sm:text-6xl font-bold tracking-tight leading-tight" style={giDelay(400)}>
              <BreakableWords text={profile.name} seedBase={220} wordClassName="text-gradient" />
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
            onMouseMove={dragging ? undefined : handleMouseMove}
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
              <div
                ref={windowRef}
                style={windowStyle}
                className="rounded-xl overflow-hidden border border-border bg-surface shadow-2xl shadow-black/40"
              >
                <div
                  {...dragHandleProps}
                  className={`flex items-stretch justify-between gap-4 pl-2 pr-1.5 bg-surface-2 border-b border-border touch-none ${
                    dragging ? "cursor-grabbing" : "cursor-grab"
                  }`}
                >
                  <div className="flex items-stretch -mb-px" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={tab === "code"}
                      onClick={() => setTab("code")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-mono text-xs border-b-2 transition-colors ${
                        tab === "code"
                          ? "bg-surface text-text border-accent"
                          : "text-muted border-transparent hover:text-text hover:bg-surface/50"
                      }`}
                    >
                      <FileIcon />
                      Developer.cs
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={tab === "terminal"}
                      onClick={() => setTab("terminal")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-mono text-xs border-b-2 transition-colors ${
                        tab === "terminal"
                          ? "bg-surface text-text border-accent"
                          : "text-muted border-transparent hover:text-text hover:bg-surface/50"
                      }`}
                    >
                      <SquareTerminal size={12} className="shrink-0" />
                      {ui.hero.terminalTabLabel}
                    </button>
                  </div>
                  <div className="flex items-center py-1.5">
                    <WindowControls
                      onMinimize={() => shakeWithMessage(ui.hero.closeAttempt)}
                      onClose={handleCloseClick}
                    />
                  </div>
                </div>
                {/* Both stay mounted so switching tabs doesn't unmount/remount
                    either one — HeroCode's typewriter reveal would otherwise
                    replay from scratch every time you come back to it, and
                    HeroTerminal's command history would reset too. */}
                {/* Stacked in one grid cell (hidden one is `invisible`, not
                    `display: none`) so the window is always as tall as the
                    taller pane and never resizes or shifts on tab switch. */}
                <div className="grid">
                  <div
                    className={`col-start-1 row-start-1 ${tab === "code" ? "" : "invisible pointer-events-none"}`}
                    aria-hidden={tab !== "code"}
                  >
                    <HeroCode />
                  </div>
                  <div
                    className={`col-start-1 row-start-1 ${tab === "terminal" ? "" : "invisible pointer-events-none"}`}
                    aria-hidden={tab !== "terminal"}
                  >
                    <HeroTerminal active={tab === "terminal"} />
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

import { ArrowDown, Mail, SquareTerminal } from "lucide-react";
import type { ReactNode } from "react";
import { Fragment, useEffect, useRef, useState } from "react";

import {
  GithubIcon,
  LinkedinIcon,
  MediumIcon,
  StackOverflowIcon,
  TelegramIcon,
} from "@/components/icons/BrandIcons";
import { FileIcon } from "@/components/ui/FileIcon";
import { Knockable } from "@/components/ui/Knockable";
import { Reveal } from "@/components/ui/Reveal";
import { WindowControls } from "@/components/ui/WindowControls";
import { HeroMinimizedEasterEgg } from "@/features/hero/HeroMinimizedEasterEgg";
import { HeroTerminal } from "@/features/hero/HeroTerminal";
import { useContent } from "@/i18n/context";
import { useDraggableWindow } from "@/hooks/useDraggableWindow";
import { useInView } from "@/hooks/useInView";
import { useTilt } from "@/hooks/useTilt";

const TOTAL_CODE_LINES = 8;
const LINE_STEP_MS = 220;

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

function CodeLine({ n, revealed, children }: { n: number; revealed: boolean; children: ReactNode }) {
  return (
    <div className="flex px-5">
      <span className="w-5 shrink-0 text-muted/50 select-none">{n}</span>
      <span
        className={`whitespace-pre-wrap inline-block typewriter-line ${revealed ? "is-revealed" : ""}`}
      >
        {children}
      </span>
    </div>
  );
}

function HeroCode() {
  const { profile, skills } = useContent();
  const stack = [...skills.backend.slice(0, 3), ...skills.frontend.slice(0, 1)];
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.4 });
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (!isInView || revealedCount >= TOTAL_CODE_LINES) return;
    const timer = window.setTimeout(() => setRevealedCount((count) => count + 1), LINE_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [isInView, revealedCount]);

  return (
    <div ref={ref} className="font-mono text-[13px] leading-7 py-5">
      <CodeLine n={1} revealed={revealedCount > 0}>
        <span className="text-accent-2">public class</span> <span className="text-text">Developer</span>
      </CodeLine>
      <CodeLine n={2} revealed={revealedCount > 1}>
        <span className="text-muted">{"{"}</span>
      </CodeLine>
      <CodeLine n={3} revealed={revealedCount > 2}>
        <span className="text-accent-2 pl-4">public string</span> <span className="text-text">Name</span>{" "}
        <span className="text-muted">=</span> <span className="text-accent">"{profile.name}"</span>
        <span className="text-muted">;</span>
      </CodeLine>
      <CodeLine n={4} revealed={revealedCount > 3}>
        <span className="text-accent-2 pl-4">public string</span> <span className="text-text">Role</span>{" "}
        <span className="text-muted">=</span> <span className="text-accent">"{profile.role}"</span>
        <span className="text-muted">;</span>
      </CodeLine>
      <CodeLine n={5} revealed={revealedCount > 4}>
        <span className="text-accent-2 pl-4">public string</span>{" "}
        <span className="text-text">Location</span> <span className="text-muted">=</span>{" "}
        <span className="text-accent">"{profile.location}"</span>
        <span className="text-muted">;</span>
      </CodeLine>
      <CodeLine n={6} revealed={revealedCount > 5}>
        <span className="text-accent-2 pl-4">public string[]</span> <span className="text-text">Stack</span>{" "}
        <span className="text-muted">= {"{"}</span>{" "}
        {stack.map((item, index) => (
          <span key={item}>
            <span className="text-accent">"{item}"</span>
            {index < stack.length - 1 && <span className="text-muted">, </span>}
          </span>
        ))}
        <span className="text-muted"> {"}"};</span>
      </CodeLine>
      <CodeLine n={7} revealed={revealedCount > 6}>
        <span className="text-accent-2 pl-4">public bool</span> <span className="text-text">Hireable</span>{" "}
        <span className="text-muted">=</span> <span className="text-accent-2">true</span>
        <span className="text-muted">;</span>
      </CodeLine>
      <CodeLine n={8} revealed={revealedCount > 7}>
        <span className="text-muted">{"}"}</span>
        {revealedCount >= TOTAL_CODE_LINES && <span className="caret ml-1" />}
      </CodeLine>
    </div>
  );
}

/** How long the FBI reveal stays up before it restores itself — also shown
 * in the reveal's own warning message, so the two can't drift apart. */
const FBI_RESTORE_SECONDS = 10;

export function Hero() {
  const { profile, socials, ui } = useContent();
  const [taglineBefore, taglineAfter] = ui.hero.tagline.split("{highlight}");
  const { ref: tiltRef, handleMouseMove, handleMouseLeave } = useTilt<HTMLDivElement>();
  const [tab, setTab] = useState<"code" | "terminal">("code");
  const [minimized, setMinimized] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [closeToast, setCloseToast] = useState(false);
  // Once the FBI reveal has been triggered and auto-restored, the close
  // button stops re-triggering it and just does the same shake/toast as
  // the minimize button instead — the "secret" only gets shown once.
  const [fbiRevealed, setFbiRevealed] = useState(false);
  const shakeTimeout = useRef<number | undefined>(undefined);
  const toastTimeout = useRef<number | undefined>(undefined);
  const restoreTimeout = useRef<number | undefined>(undefined);
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
      window.clearTimeout(restoreTimeout.current);
    };
  }, []);

  // Wired to the minimize button — it refuses to minimize and just wiggles
  // the window instead, restarting the shake even if it's already
  // mid-animation. Also what the close button falls back to once the FBI
  // reveal has already been shown once.
  function handleCloseAttempt() {
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
    window.clearTimeout(shakeTimeout.current);
    shakeTimeout.current = window.setTimeout(() => setShaking(false), 500);

    setCloseToast(true);
    window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setCloseToast(false), 2200);
  }

  function restoreFromFbiReveal() {
    window.clearTimeout(restoreTimeout.current);
    setMinimized(false);
  }

  // First close click reveals the FBI easter egg and auto-restores itself
  // after FBI_RESTORE_SECONDS; every click after that just shakes the
  // window like the minimize button does.
  function handleCloseClick() {
    if (fbiRevealed) {
      handleCloseAttempt();
      return;
    }
    setFbiRevealed(true);
    setMinimized(true);
    window.clearTimeout(restoreTimeout.current);
    restoreTimeout.current = window.setTimeout(restoreFromFbiReveal, FBI_RESTORE_SECONDS * 1000);
  }


  return (
    <section id="top" className="relative min-h-screen flex items-center bg-grid overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/4 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-accent-2/15 blur-3xl blob-drift-a" />
      <div className="pointer-events-none absolute top-1/3 right-0 w-[420px] h-[420px] rounded-full bg-accent/10 blur-3xl blob-drift-b" />

      <div className="relative max-w-6xl mx-auto px-6 py-32 w-full grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-16 items-center">
        <div>
          <Reveal>
            <p className="font-mono text-accent text-sm mb-4">
              <BreakableWords text={ui.hero.greeting} seedBase={200} />
            </p>
          </Reveal>

          <Reveal delayMs={100}>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
              <BreakableWords text={profile.name} seedBase={220} wordClassName="text-gradient" />
            </h1>
          </Reveal>

          <Reveal delayMs={200}>
            <h2 className="text-2xl sm:text-4xl font-semibold text-muted mt-2">
              <BreakableWords text={taglineBefore} seedBase={240} />
              <Knockable seed={260}>{ui.hero.highlightWord}</Knockable>
              <BreakableWords text={taglineAfter} seedBase={261} />
            </h2>
          </Reveal>

          <Reveal delayMs={300}>
            <p className="max-w-xl text-muted mt-6 leading-relaxed">
              <BreakableWords text={profile.summary} seedBase={280} />
            </p>
          </Reveal>

          <Reveal delayMs={400} className="flex flex-wrap items-center gap-4 mt-10">
            <Knockable seed={103} className="inline-flex items-center">
              <a
                href="#projects"
                className="inline-flex items-center justify-center btn-pulse rounded-md px-6 py-3 bg-accent text-bg font-mono text-sm font-medium hover:brightness-110 transition"
              >
                {ui.hero.ctaViewWork}
              </a>
            </Knockable>
            <Knockable seed={104} className="inline-flex items-center">
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-border font-mono text-sm text-text hover:border-accent hover:text-accent transition"
              >
                {ui.hero.ctaGetInTouch}
              </a>
            </Knockable>
          </Reveal>

          <Reveal delayMs={500} className="mt-12">
            <Knockable seed={116} className="inline-block">
              <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-surface/70 backdrop-blur-sm p-1.5 shadow-inner shadow-black/5">
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
                <span className="h-4 w-px bg-border mx-1" aria-hidden="true" />
                <Knockable seed={115} className="inline-flex items-center">
                  <a
                    href={socials.email}
                    aria-label="Email"
                    className="inline-flex items-center justify-center p-2 rounded-full text-muted hover:text-accent hover:bg-surface-2 transition"
                  >
                    <Mail size={19} />
                  </a>
                </Knockable>
              </div>
            </Knockable>
          </Reveal>
        </div>

        <Reveal delayMs={250} className="hidden lg:block animate-float-slow">
          <div
            ref={tiltRef}
            onMouseMove={dragging ? undefined : handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative transition-transform duration-300 ease-out will-change-transform"
          >
            <HeroMinimizedEasterEgg
              visible={minimized}
              restoreSeconds={FBI_RESTORE_SECONDS}
              onRestore={restoreFromFbiReveal}
            />
            {closeToast && (
              <div
                role="status"
                className="animate-popover-in absolute -top-3 right-4 z-10 -translate-y-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text shadow-xl shadow-black/30"
              >
                {ui.hero.closeAttempt}
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
                    <WindowControls onMinimize={handleCloseAttempt} onClose={handleCloseClick} />
                  </div>
                </div>
                {tab === "code" ? <HeroCode /> : <HeroTerminal />}
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

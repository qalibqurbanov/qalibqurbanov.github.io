import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { glitchScreen } from "@/hooks/glitch";
import { useProjectRoute } from "@/hooks/useProjectRoute";
import { useContent, useLocale } from "@/i18n/context";
import { isLocale, SUPPORTED_LOCALES } from "@/i18n/locale";
import { glitchStorm, matrixRain } from "@/lib/effects";
import { format } from "@/lib/format";
import { scrollToTop } from "@/lib/scroll";
import { useTheme } from "@/theme/context";

interface LogEntry {
  type: "input" | "output" | "error" | "welcome" | "boot";
  text: string;
}

function TerminalPrompt() {
  return (
    <>
      <span className="text-accent">guest</span>
      <span className="text-muted">@portfolio:~$</span>
    </>
  );
}

/** A fake shell dropped into the hero's code window — reuses the site's real
 * content (profile, skills, projects) so its answers stay correct without a
 * second copy of that data living in command responses. */
export function HeroTerminal({ active }: { active: boolean }) {
  const { profile, skills, experience, projects, socials, ui } = useContent();
  const { setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { openProject, openResume } = useProjectRoute();

  const [log, setLog] = useState<LogEntry[]>([]);
  // How many intro steps have been printed: one per boot line, then the
  // welcome hint. The intro starts the first time the terminal is on screen
  // and the prompt only appears once it is done.
  const [introStep, setIntroStep] = useState(0);
  const bootLines = useMemo(
    () =>
      ui.terminal.boot.map((line) =>
        format(line, {
          name: profile.name,
          projects: String(projects.length),
          skills: String(Object.values(skills).flat().length),
        }),
      ),
    [ui.terminal.boot, profile.name, projects.length, skills],
  );
  const introLength = bootLines.length + 1;
  const ready = introStep >= introLength;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [log]);

  // One intro step per tick; each render schedules the next, so there is no
  // timer state to carry between renders.
  useEffect(() => {
    if (!active || ready) return;
    const entry: LogEntry =
      introStep < bootLines.length
        ? { type: "boot", text: bootLines[introStep] }
        : { type: "welcome", text: "" };
    const delay = reducedMotion ? 0 : introStep === 0 ? 350 : 180 + Math.random() * 260;
    const id = window.setTimeout(() => {
      setLog((current) => [...current, entry]);
      setIntroStep(introStep + 1);
    }, delay);
    return () => window.clearTimeout(id);
  }, [active, ready, introStep, bootLines, reducedMotion]);

  // Any key (or a click) skips straight to the prompt.
  useEffect(() => {
    if (!active || ready) return;
    function skip() {
      setLog((current) => [
        ...current,
        ...bootLines.slice(introStep).map((text) => ({ type: "boot" as const, text })),
        ...(introStep <= bootLines.length ? [{ type: "welcome" as const, text: "" }] : []),
      ]);
      setIntroStep(introLength);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      skip();
    }
    const container = scrollRef.current;
    window.addEventListener("keydown", handleKey);
    container?.addEventListener("click", skip);
    return () => {
      window.removeEventListener("keydown", handleKey);
      container?.removeEventListener("click", skip);
    };
  }, [active, ready, introStep, bootLines, introLength]);

  function print(text: string, type: LogEntry["type"] = "output") {
    setLog((current) => [...current, { type, text }]);
  }

  function runCommand(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    setLog((current) => [...current, { type: "input", text: trimmed }]);
    setHistory((current) => [...current, trimmed]);
    setHistoryIndex(null);

    const [cmd, ...rest] = trimmed.split(/\s+/);
    const arg = rest.join(" ");

    switch (cmd.toLowerCase()) {
      case "help":
        print(ui.terminal.helpText);
        break;
      case "whoami":
        print(`${profile.name} — ${profile.role} — ${profile.location}`);
        break;
      case "about":
        print(profile.summary);
        break;
      case "skills":
        print(
          (Object.keys(skills) as Array<keyof typeof skills>)
            .map((key) => `${ui.skillGroups[key]}: ${skills[key].join(", ")}`)
            .join("\n"),
        );
        break;
      case "experience":
        print(
          experience
            .map(
              (item) =>
                `${item.role} — ${item.org} (${item.period})\n  ${item.tags.join(", ")}`,
            )
            .join("\n\n"),
        );
        break;
      case "projects":
        print(projects.map((project) => `${project.slug.padEnd(16)} ${project.title}`).join("\n"));
        break;
      case "open": {
        const project = projects.find((item) => item.slug === arg);
        if (project) {
          print(format(ui.terminal.openingProject, { title: project.title }));
          openProject(project.slug);
        } else {
          print(format(ui.terminal.projectNotFound, { slug: arg }), "error");
        }
        break;
      }
      case "contact":
        print(`${profile.email}\n${socials.github}\n${socials.linkedin}`);
        break;
      case "resume":
        if (profile.resumeUrl && profile.resumeUrl !== "#") {
          openResume();
        } else {
          print(format(ui.terminal.notFound, { cmd }), "error");
        }
        break;
      case "github":
        window.open(socials.github, "_blank", "noreferrer");
        break;
      case "linkedin":
        window.open(socials.linkedin, "_blank", "noreferrer");
        break;
      case "telegram":
        if (socials.telegram) {
          window.open(socials.telegram, "_blank", "noreferrer");
        } else {
          print(format(ui.terminal.notFound, { cmd }), "error");
        }
        break;
      case "medium":
        if (socials.medium) {
          window.open(socials.medium, "_blank", "noreferrer");
        } else {
          print(format(ui.terminal.notFound, { cmd }), "error");
        }
        break;
      case "stackoverflow":
        if (socials.stackoverflow) {
          window.open(socials.stackoverflow, "_blank", "noreferrer");
        } else {
          print(format(ui.terminal.notFound, { cmd }), "error");
        }
        break;
      case "theme":
        print(format(ui.terminal.themeSwitched, { mode: theme === "dark" ? ui.labels.modeLight : ui.labels.modeDark }));
        toggleTheme();
        break;
      case "lang": {
        if (isLocale(arg)) {
          const meta = SUPPORTED_LOCALES.find((item) => item.code === arg);
          print(format(ui.terminal.langSwitched, { label: meta?.nativeName ?? arg }));
          setLocale(arg);
        } else {
          print(format(ui.terminal.langInvalid, { code: arg || "" }), "error");
        }
        break;
      }
      case "home":
        scrollToTop();
        break;
      case "clear":
        setLog([]);
        break;
      case "sudo":
        print(ui.terminal.permissionDenied, "error");
        glitchScreen();
        break;
      case "glitch":
        print(ui.terminal.glitchOn);
        glitchStorm();
        break;
      case "matrix":
        print(ui.terminal.matrixOn);
        matrixRain();
        break;
      default:
        print(format(ui.terminal.notFound, { cmd }), "error");
    }
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      runCommand(value);
      setValue("");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === null ? history.length - 1 : Math.max(historyIndex - 1, 0);
      setHistoryIndex(nextIndex);
      setValue(history[nextIndex]);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(null);
        setValue("");
      } else {
        setHistoryIndex(nextIndex);
        setValue(history[nextIndex]);
      }
    }
  }

  return (
    <div
      ref={scrollRef}
      onClick={() => inputRef.current?.focus()}
      className="terminal-scroll font-mono text-[13px] leading-6 p-5 h-[292px] overflow-y-auto selectable"
    >
      {log.map((entry, index) => (
        <div
          key={index}
          className={entry.type === "error" ? "text-accent-2" : entry.type === "input" ? "text-text" : "text-muted"}
        >
          {entry.type === "input" ? (
            <span>
              <TerminalPrompt /> {entry.text}
            </span>
          ) : entry.type === "boot" ? (
            <pre className="whitespace-pre-wrap font-mono">
              <span className="text-accent">[ ok ]</span> {entry.text}
            </pre>
          ) : (
            <pre className="whitespace-pre-wrap font-mono">{entry.type === "welcome" ? ui.terminal.welcome : entry.text}</pre>
          )}
        </div>
      ))}
      {ready ? (
        <div className="flex items-center gap-2 mt-1">
          <TerminalPrompt />
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            aria-label={ui.labels.terminalInput}
            className="flex-1 bg-transparent outline-none text-text"
          />
        </div>
      ) : (
        <div className="mt-1" aria-hidden="true">
          <span className="caret" />
        </div>
      )}
    </div>
  );
}

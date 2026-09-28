import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { useProjectRoute } from "@/hooks/useProjectRoute";
import { useContent, useLocale } from "@/i18n/context";
import { isLocale, SUPPORTED_LOCALES } from "@/i18n/locale";
import { format } from "@/lib/format";
import { scrollToTop } from "@/lib/scroll";
import { useTheme } from "@/theme/context";

interface LogEntry {
  type: "input" | "output" | "error";
  text: string;
}

/** A fake shell dropped into the hero's code window — reuses the site's real
 * content (profile, skills, projects) so its answers stay correct without a
 * second copy of that data living in command responses. */
export function HeroTerminal() {
  const { profile, skills, experience, projects, socials, ui } = useContent();
  const { setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { openProject } = useProjectRoute();

  const [log, setLog] = useState<LogEntry[]>([{ type: "output", text: ui.terminal.welcome }]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [log]);

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
          window.open(profile.resumeUrl, "_blank", "noreferrer");
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
        print(format(ui.terminal.themeSwitched, { mode: theme === "dark" ? "light" : "dark" }));
        toggleTheme();
        break;
      case "lang": {
        if (isLocale(arg)) {
          const meta = SUPPORTED_LOCALES.find((item) => item.code === arg);
          print(format(ui.terminal.langSwitched, { label: meta?.label ?? arg }));
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
              <span className="text-accent">guest</span>
              <span className="text-muted">@portfolio:~$ </span>
              {entry.text}
            </span>
          ) : (
            <pre className="whitespace-pre-wrap font-mono">{entry.text}</pre>
          )}
        </div>
      ))}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-accent">guest</span>
        <span className="text-muted">@portfolio:~$</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          aria-label="Terminal input"
          className="flex-1 bg-transparent outline-none text-text"
        />
      </div>
    </div>
  );
}

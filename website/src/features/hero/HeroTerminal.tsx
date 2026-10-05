import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { glitchScreen } from "@/hooks/glitch";
import { useProjectRoute } from "@/hooks/useProjectRoute";
import { useContent, useLocale } from "@/i18n/context";
import { isLocale, SUPPORTED_LOCALES } from "@/i18n/locale";
import { colorizeBrackets } from "@/lib/brackets";
import { glitchStorm, matrixRain } from "@/lib/effects";
import { format } from "@/lib/format";
import { scrollToTop } from "@/lib/scroll";
import type { Theme } from "@/theme/context";

import type { MenuNode } from "./TerminalMenu";
import { TerminalMenu } from "./TerminalMenu";

interface LogEntry {
  /** `table` is output whose lines are `key  description` pairs (help,
   * projects, skills), so the key column can be coloured. */
  type: "input" | "output" | "error" | "welcome" | "table";
  text: string;
}

/** Every command `runCommand` understands — used to colour a typed command
 * green when it exists and red when it doesn't, like a real shell would. */
const KNOWN_COMMANDS = new Set([
  "help", "whoami", "about", "skills", "experience", "projects", "open", "contact",
  "resume", "github", "linkedin", "telegram", "medium", "stackoverflow", "theme",
  "lang", "home", "clear", "sudo", "glitch", "matrix", "menu",
]);

/** `key  description` (two or more spaces) or `key: description`. */
const TABLE_ROW = /^(.*?)(\s{2,}|: )(.*)$/;

function TerminalPrompt() {
  return (
    <span>
      <span className="text-accent font-bold">guest</span>
      <span className="text-accent-2">@portfolio</span>
      <span className="text-muted">:</span>
      <span className="text-syn-type">~</span>
      <span className="text-muted">$</span>
    </span>
  );
}

function CommandLine({ text }: { text: string }) {
  const [cmd, ...rest] = text.split(/\s+/);
  const args = rest.join(" ");
  return (
    <>
      <span className={KNOWN_COMMANDS.has(cmd.toLowerCase()) ? "text-accent font-medium" : "text-danger font-medium"}>
        {cmd}
      </span>
      {args && <span className="text-syn-number"> {colorizeBrackets(args)}</span>}
    </>
  );
}

function TableOutput({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, index) => {
        const match = TABLE_ROW.exec(line);
        return (
          <div key={index} className="whitespace-pre-wrap">
            {match ? (
              <>
                <span className="text-accent-2">{match[1]}</span>
                <span>{match[2]}</span>
                <span>{colorizeBrackets(match[3])}</span>
              </>
            ) : (
              line
            )}
          </div>
        );
      })}
    </>
  );
}

interface HeroTerminalProps {
  /** Called with the command word each time a command is run, for the tab's title. */
  onCommand?: (name: string) => void;
  /** A command to run once, right after the terminal opens. */
  initialCommand?: string;
  /** The hero window's own theme, which the `theme` command switches. */
  theme: Theme;
  onToggleTheme: () => void;
}

/** A fake shell dropped into the hero's code window — reuses the site's real
 * content (profile, skills, projects) so its answers stay correct without a
 * second copy of that data living in command responses. */
export function HeroTerminal({ onCommand, initialCommand, theme, onToggleTheme }: HeroTerminalProps) {
  const { profile, skills, experience, projects, socials, ui } = useContent();
  const { setLocale } = useLocale();
  const { openProject, openResume } = useProjectRoute();

  const [log, setLog] = useState<LogEntry[]>([{ type: "welcome", text: "" }]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);

  // A terminal tab is only ever created by clicking "+", so take the focus;
  // the input also gets it back whenever the menu closes.
  useEffect(() => {
    if (!menuOpen) inputRef.current?.focus({ preventScroll: true });
  }, [menuOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [log]);

  function print(text: string, type: LogEntry["type"] = "output") {
    setLog((current) => [...current, { type, text }]);
  }

  /** The menu tree. Leaves name a command, so everything the menu does is
   * also visible in (and repeatable from) the log. */
  function buildMenu(): MenuNode[] {
    const { groups, items } = ui.terminal.menu;
    const links: MenuNode[] = [
      { label: items.contactInfo, command: "contact" },
      ...(profile.resumeUrl && profile.resumeUrl !== "#" ? [{ label: items.resume, command: "resume" }] : []),
      { label: "GitHub", command: "github" },
      { label: "LinkedIn", command: "linkedin" },
      ...(socials.telegram ? [{ label: "Telegram", command: "telegram" }] : []),
      ...(socials.medium ? [{ label: "Medium", command: "medium" }] : []),
      ...(socials.stackoverflow ? [{ label: "Stack Overflow", command: "stackoverflow" }] : []),
    ];

    return [
      {
        label: groups.profile,
        children: [
          { label: items.whoami, command: "whoami" },
          { label: items.about, command: "about" },
          { label: items.skills, command: "skills" },
        ],
      },
      {
        label: groups.work,
        children: [
          { label: items.experience, command: "experience" },
          { label: items.projects, command: "projects" },
          ...projects.map((project) => ({ label: project.title, command: `open ${project.slug}` })),
        ],
      },
      { label: groups.contact, children: links },
      {
        label: groups.settings,
        children: [
          { label: items.theme, command: "theme" },
          {
            label: items.language,
            children: SUPPORTED_LOCALES.map((meta) => ({ label: meta.nativeName, command: `lang ${meta.code}` })),
          },
        ],
      },
      {
        label: groups.fun,
        children: [
          { label: items.glitch, command: "glitch" },
          { label: items.matrix, command: "matrix" },
        ],
      },
    ];
  }

  function runFromMenu(command: string) {
    setMenuOpen(false);
    runCommand(command);
  }

  function runCommand(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    setLog((current) => [...current, { type: "input", text: trimmed }]);
    setHistory((current) => [...current, trimmed]);
    setHistoryIndex(null);

    const [cmd, ...rest] = trimmed.split(/\s+/);
    const arg = rest.join(" ");
    onCommand?.(cmd.toLowerCase());

    switch (cmd.toLowerCase()) {
      case "help":
        print(ui.terminal.helpText, "table");
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
          "table",
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
        print(projects.map((project) => `${project.slug.padEnd(16)}  ${project.title}`).join("\n"), "table");
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
        onToggleTheme();
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
      case "menu":
        setMenuOpen(true);
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

  // Runs once; the ref also keeps StrictMode's double effect from running it twice.
  const ranInitialCommand = useRef(false);
  useEffect(() => {
    if (!initialCommand || ranInitialCommand.current) return;
    ranInitialCommand.current = true;
    runCommand(initialCommand);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only by design
  }, []);

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
      {menuOpen ? (
        <TerminalMenu
          items={buildMenu()}
          title="menu"
          labels={ui.terminal.menu}
          onRun={runFromMenu}
          onClose={() => setMenuOpen(false)}
        />
      ) : (
        <>
          {log.map((entry, index) => (
            <div
              key={index}
              className={
                entry.type === "error"
                  ? "text-danger"
                  : entry.type === "welcome"
                    ? "text-muted"
                    : "text-text/85"
              }
            >
              {entry.type === "input" ? (
                <span>
                  <TerminalPrompt /> <CommandLine text={entry.text} />
                </span>
              ) : entry.type === "table" ? (
                <TableOutput text={entry.text} />
              ) : (
                <pre className="whitespace-pre-wrap font-mono">
                  {colorizeBrackets(entry.type === "welcome" ? ui.terminal.welcome : entry.text)}
                </pre>
              )}
            </div>
          ))}
          {/* Active-line highlight, like an editor's current line: spans the
              window's full width (cancelling the container padding). */}
          <div className="-mx-5 mt-1 flex items-center gap-2 border-l-2 border-accent bg-accent/10 px-5 pl-[18px]">
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
        </>
      )}
    </div>
  );
}

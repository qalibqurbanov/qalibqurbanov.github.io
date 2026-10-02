import { useEffect, useMemo, useState } from "react";

import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";

/** How long the closing "[ finishing ]" progress bar runs. */
const PROGRESS_MS = 3000;
const BAR_CELLS = 24;
/** Wait before the first line, so it lands as the window finishes cutting in. */
const FIRST_LINE_DELAY_MS = 900;
const FADE_MS = 300;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

interface HeroBootProps {
  /** Called once the boot has finished (or been skipped) and faded out. */
  onDone: () => void;
}

/** The hero window's boot screen: it covers the whole window body, prints a
 * run of status lines, then a progress bar for three seconds, and fades away
 * to reveal the window. Any key or click skips it. */
export function HeroBoot({ onDone }: HeroBootProps) {
  const { profile, experience, projects, skills, blogPosts, socials, ui } = useContent();
  const lines = useMemo(() => {
    const vars = {
      name: profile.name,
      role: profile.role,
      location: profile.location,
      email: profile.email,
      orgs: [...new Set(experience.map((item) => item.org))].join(", "),
      backend: String(skills.backend.length),
      frontend: String(skills.frontend.length),
      mobile: String(skills.mobile.length),
      tools: String(skills.tools.length),
      posts: String(blogPosts.length),
      socials: Object.entries(socials)
        .filter(([key, url]) => key !== "email" && url)
        .map(([key]) => key)
        .join("/"),
    };
    // A line with a {title} token is printed once per project.
    return ui.terminal.boot.flatMap((line) =>
      line.includes("{title}")
        ? projects.map((project) => format(line, { ...vars, title: project.title }))
        : [format(line, vars)],
    );
  }, [ui.terminal.boot, profile, experience, projects, skills, blogPosts, socials]);

  const [shown, setShown] = useState(0);
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const linesDone = shown >= lines.length;

  // One line per tick; each render schedules the next.
  useEffect(() => {
    if (linesDone) return;
    const delay = shown === 0 ? FIRST_LINE_DELAY_MS : 80 + Math.random() * 70;
    const id = window.setTimeout(() => setShown(shown + 1), delay);
    return () => window.clearTimeout(id);
  }, [shown, linesDone]);

  // Then the progress bar, eased so it starts and ends gently.
  useEffect(() => {
    if (!linesDone) return;
    const start = performance.now();
    const id = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / PROGRESS_MS);
      setProgress(easeInOut(t));
      if (t >= 1) window.clearInterval(id);
    }, 50);
    return () => window.clearInterval(id);
  }, [linesDone]);

  // A beat on 100%, then fade out, then hand back to the window.
  useEffect(() => {
    if (progress < 1) return;
    const id = window.setTimeout(() => setLeaving(true), 250);
    return () => window.clearTimeout(id);
  }, [progress]);

  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(onDone, FADE_MS);
    return () => window.clearTimeout(id);
  }, [leaving, onDone]);

  useEffect(() => {
    function skip(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      onDone();
    }
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [onDone]);

  const filled = Math.round(progress * BAR_CELLS);
  const percent = Math.round(progress * 100);

  return (
    <div
      onClick={onDone}
      aria-hidden="true"
      style={{ transitionDuration: `${FADE_MS}ms` }}
      className={`absolute inset-0 z-10 flex flex-col justify-start overflow-hidden bg-surface p-4 font-mono text-xs leading-5 text-muted transition-opacity ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {lines.slice(0, shown).map((line, index) => (
        <div key={index} className="truncate">
          <span className="text-accent">[ ok ]</span> {line}
        </div>
      ))}
      {linesDone ? (
        <div className="truncate tabular-nums">
          <span className="text-accent-2">[ {ui.terminal.finishing} ]</span>{" "}
          <span className="text-accent">
            {"█".repeat(filled)}
            {"░".repeat(BAR_CELLS - filled)}
          </span>{" "}
          {String(percent).padStart(3, " ")}%
        </div>
      ) : (
        <div>
          <span className="caret" />
        </div>
      )}
    </div>
  );
}

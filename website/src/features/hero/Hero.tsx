import { ArrowDown, Mail } from "lucide-react";
import type { ReactNode } from "react";

import { GithubIcon, LinkedinIcon } from "@/components/icons/BrandIcons";
import { CodeWindow } from "@/components/ui/CodeWindow";
import { Reveal } from "@/components/ui/Reveal";
import { useContent } from "@/i18n/context";
import { useTilt } from "@/hooks/useTilt";

function CodeLine({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex px-5">
      <span className="w-5 shrink-0 text-muted/50 select-none">{n}</span>
      <span className="whitespace-pre-wrap">{children}</span>
    </div>
  );
}

export function Hero() {
  const { profile, socials, skills, ui } = useContent();
  const [taglineBefore, taglineAfter] = ui.hero.tagline.split("{highlight}");
  const stack = [...skills.frontend.slice(0, 2), ...skills.backend.slice(0, 2)];
  const { ref: tiltRef, handleMouseMove, handleMouseLeave } = useTilt<HTMLDivElement>();

  return (
    <section id="top" className="relative min-h-screen flex items-center bg-grid overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/4 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-accent-2/15 blur-3xl blob-drift-a" />
      <div className="pointer-events-none absolute top-1/3 right-0 w-[420px] h-[420px] rounded-full bg-accent/10 blur-3xl blob-drift-b" />

      <div className="relative max-w-6xl mx-auto px-6 py-32 w-full grid lg:grid-cols-[1.05fr_1fr] gap-16 items-center">
        <div>
          <Reveal>
            <p className="font-mono text-accent text-sm mb-4">{ui.hero.greeting}</p>
          </Reveal>

          <Reveal delayMs={100}>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
              {profile.name}
            </h1>
          </Reveal>

          <Reveal delayMs={200}>
            <h2 className="text-2xl sm:text-4xl font-semibold text-muted mt-2">
              {taglineBefore}
              <span className="text-gradient">{ui.hero.highlightWord}</span>
              {taglineAfter}
            </h2>
          </Reveal>

          <Reveal delayMs={300}>
            <p className="max-w-xl text-muted mt-6 leading-relaxed">{profile.summary}</p>
          </Reveal>

          <Reveal delayMs={400} className="flex flex-wrap items-center gap-4 mt-10">
            <a
              href="#projects"
              className="btn-pulse rounded-md px-6 py-3 bg-accent text-bg font-mono text-sm font-medium hover:brightness-110 transition"
            >
              {ui.hero.ctaViewWork}
            </a>
            <a
              href="#contact"
              className="px-6 py-3 rounded-md border border-border font-mono text-sm text-text hover:border-accent hover:text-accent transition"
            >
              {ui.hero.ctaGetInTouch}
            </a>
          </Reveal>

          <Reveal delayMs={500} className="flex items-center gap-5 mt-12">
            <a
              href={socials.github}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="text-muted hover:text-accent transition"
            >
              <GithubIcon size={20} />
            </a>
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="text-muted hover:text-accent transition"
            >
              <LinkedinIcon size={20} />
            </a>
            <a href={socials.email} aria-label="Email" className="text-muted hover:text-accent transition">
              <Mail size={20} />
            </a>
          </Reveal>
        </div>

        <Reveal delayMs={250} className="hidden lg:block animate-float-slow">
          <div
            ref={tiltRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="transition-transform duration-300 ease-out will-change-transform"
          >
            <CodeWindow filename="Developer.cs">
              <div className="font-mono text-[13px] leading-7 py-5">
                <CodeLine n={1}>
                  <span className="text-accent-2">public class</span> <span className="text-text">Developer</span>
                </CodeLine>
                <CodeLine n={2}>
                  <span className="text-muted">{"{"}</span>
                </CodeLine>
                <CodeLine n={3}>
                  <span className="text-accent-2 pl-4">public string</span>{" "}
                  <span className="text-text">Name</span> <span className="text-muted">=</span>{" "}
                  <span className="text-accent">"{profile.name}"</span>
                  <span className="text-muted">;</span>
                </CodeLine>
                <CodeLine n={4}>
                  <span className="text-accent-2 pl-4">public string</span>{" "}
                  <span className="text-text">Role</span> <span className="text-muted">=</span>{" "}
                  <span className="text-accent">"{profile.role}"</span>
                  <span className="text-muted">;</span>
                </CodeLine>
                <CodeLine n={5}>
                  <span className="text-accent-2 pl-4">public string</span>{" "}
                  <span className="text-text">Location</span> <span className="text-muted">=</span>{" "}
                  <span className="text-accent">"{profile.location}"</span>
                  <span className="text-muted">;</span>
                </CodeLine>
                <CodeLine n={6}>
                  <span className="text-accent-2 pl-4">public string[]</span>{" "}
                  <span className="text-text">Stack</span> <span className="text-muted">= {"{"}</span>{" "}
                  {stack.map((item, index) => (
                    <span key={item}>
                      <span className="text-accent">"{item}"</span>
                      {index < stack.length - 1 && <span className="text-muted">, </span>}
                    </span>
                  ))}
                  <span className="text-muted"> {"}"};</span>
                </CodeLine>
                <CodeLine n={7}>
                  <span className="text-accent-2 pl-4">public bool</span>{" "}
                  <span className="text-text">Hireable</span> <span className="text-muted">=</span>{" "}
                  <span className="text-accent-2">true</span>
                  <span className="text-muted">;</span>
                </CodeLine>
                <CodeLine n={8}>
                  <span className="text-muted">{"}"}</span>
                  <span className="caret ml-1" />
                </CodeLine>
              </div>
            </CodeWindow>
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

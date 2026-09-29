import { ArrowLeft, ExternalLink, Moon, Sun } from "lucide-react";

import { GithubIcon } from "@/components/icons/BrandIcons";
import { CodeWindow } from "@/components/ui/CodeWindow";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Tag } from "@/components/ui/Tag";
import { useContent } from "@/i18n/context";
import { filenameFor } from "@/lib/projectFilename";
import { useTheme } from "@/theme/context";
import type { Project } from "@/types/content";

interface ProjectDetailProps {
  project: Project | null;
  onBack: () => void;
}

function DetailSection({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-6">
      <p className="font-mono text-xs text-accent mb-1.5">{label}</p>
      <p className="text-muted text-sm leading-relaxed">{text}</p>
    </div>
  );
}

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const { ui } = useContent();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border">
        <Container className="flex items-center justify-between py-4">
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onBack();
            }}
            className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-accent transition"
          >
            <ArrowLeft size={16} />
            {ui.projectDetail.back}
          </a>

          <button
            type="button"
            className="text-muted hover:text-accent transition-colors"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </Container>
      </header>

      <main className="flex-1 min-h-0 py-8">
        <Container className="max-w-3xl h-full">
          {!project ? (
            <div className="text-center py-24">
              <h1 className="text-2xl font-semibold">{ui.projectDetail.notFoundTitle}</h1>
              <p className="text-muted mt-3">{ui.projectDetail.notFoundBody}</p>
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  onBack();
                }}
                className="inline-block mt-8 rounded-md px-6 py-3 bg-accent text-bg font-mono text-sm font-medium hover:brightness-110 transition"
              >
                {ui.projectDetail.backHome}
              </a>
            </div>
          ) : (
            <Reveal className="h-full flex flex-col min-h-0">
              {/* Capped to the space between the header and viewport bottom
                  (via the h-full chain above) instead of letting the page
                  itself grow — the content below scrolls inside the window
                  when it's taller than that, so the header stays put. */}
              <CodeWindow filename={filenameFor(project, 0)} className="flex flex-col min-h-0 max-h-full">
                <div className="p-8 flex-1 overflow-y-auto min-h-0">
                  <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
                  <p className="text-muted mt-4 leading-relaxed">{project.description}</p>

                  <div className="flex flex-wrap gap-2 mt-6">
                    {project.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>

                  {project.problem && (
                    <DetailSection label={ui.projectDetail.problemLabel} text={project.problem} />
                  )}
                  {project.approach && (
                    <DetailSection label={ui.projectDetail.approachLabel} text={project.approach} />
                  )}
                  {project.stack && project.stack.length > 0 && (
                    <div className="mt-6">
                      <p className="font-mono text-xs text-accent mb-2">{ui.projectDetail.stackLabel}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.stack.map((item) => (
                          <Tag key={item}>{item}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.outcome && (
                    <DetailSection label={ui.projectDetail.outcomeLabel} text={project.outcome} />
                  )}

                  <div className="flex flex-wrap gap-4 mt-10">
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border font-mono text-sm hover:border-accent hover:text-accent transition"
                    >
                      <GithubIcon size={16} />
                      {ui.projectDetail.viewRepo}
                    </a>
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent text-bg font-mono text-sm font-medium hover:brightness-110 transition"
                    >
                      <ExternalLink size={16} />
                      {ui.projectDetail.viewLive}
                    </a>
                  </div>
                </div>
              </CodeWindow>
            </Reveal>
          )}
        </Container>
      </main>
    </div>
  );
}

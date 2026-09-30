import { ArrowLeft, Download, Moon, Sun } from "lucide-react";

import { CodeWindow } from "@/components/ui/CodeWindow";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { useContent } from "@/i18n/context";
import { useTheme } from "@/theme/context";

interface ResumeViewerProps {
  onBack: () => void;
}

/** Full-page resume view, laid out like a project case study: a header with
 * a back link, and the PDF shown inline inside the site's code-window chrome. */
export function ResumeViewer({ onBack }: ResumeViewerProps) {
  const { profile, ui } = useContent();
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
            {ui.resumeView.back}
          </a>

          <div className="flex items-center gap-5">
            <a
              href={profile.resumeUrl}
              download
              className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-accent transition"
            >
              <Download size={16} />
              {ui.contextMenu.downloadResume}
            </a>
            <button
              type="button"
              className="text-muted hover:text-accent transition-colors"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? ui.labels.switchToLight : ui.labels.switchToDark}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </Container>
      </header>

      <main className="flex-1 min-h-0 py-8">
        <Container className="max-w-4xl h-full">
          <Reveal className="h-full flex flex-col min-h-0">
            <CodeWindow filename="resume.pdf" className="flex flex-col h-full min-h-0" onClose={onBack}>
              <object
                data={`${profile.resumeUrl}#view=FitH`}
                type="application/pdf"
                aria-label={ui.labels.resume}
                className="flex-1 min-h-0 w-full bg-white"
              >
                <div className="p-8 text-center text-sm text-muted">
                  <p>{ui.resumeView.fallback}</p>
                  <a
                    href={profile.resumeUrl}
                    download
                    className="inline-block mt-4 rounded-md px-5 py-2.5 bg-accent text-bg font-mono text-sm font-medium hover:brightness-110 transition"
                  >
                    {ui.contextMenu.downloadResume}
                  </a>
                </div>
              </object>
            </CodeWindow>
          </Reveal>
        </Container>
      </main>
    </div>
  );
}

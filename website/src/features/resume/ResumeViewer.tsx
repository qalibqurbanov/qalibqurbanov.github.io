import { CodeWindow } from "@/components/ui/CodeWindow";
import { Reveal } from "@/components/ui/Reveal";
import { ViewModal } from "@/components/ui/ViewModal";
import { useContent } from "@/i18n/context";

interface ResumeViewerProps {
  onBack: () => void;
}

/** Full-page resume view, laid out like a project case study: a header with
 * a back link, and the PDF shown inline inside the site's code-window chrome. */
export function ResumeViewer({ onBack }: ResumeViewerProps) {
  const { profile, ui } = useContent();

  return (
    <ViewModal title={ui.labels.resume} widthClass="max-w-4xl" onClose={onBack}>
      {(close) => (
        <main className="flex-1 min-h-0">
          <div className="h-full">
            <Reveal className="h-full flex flex-col min-h-0">
              <CodeWindow
                filename="resume.pdf"
                className="flex flex-col h-full min-h-0"
                onClose={close}
              >
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
          </div>
        </main>
      )}
    </ViewModal>
  );
}

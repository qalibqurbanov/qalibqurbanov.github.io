import { Download, ExternalLink, FileText } from "lucide-react";
import { useState } from "react";

import { CodeWindow } from "@/components/ui/CodeWindow";
import { Reveal } from "@/components/ui/Reveal";
import { ViewModal } from "@/components/ui/ViewModal";
import { useContent } from "@/i18n/context";

interface ResumeViewerProps {
  onBack: () => void;
}

/** Whether an embedded PDF viewer is worth offering. Phones and tablets open a
 * PDF in their own viewer: an embedded one shows only the first page, or nothing,
 * so they get the buttons instead. */
function canShowPdfInline(): boolean {
  if (navigator.pdfViewerEnabled === false) return false;
  return !window.matchMedia("(pointer: coarse)").matches;
}

const BUTTON = "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5 font-mono text-sm font-medium transition";
const PRIMARY = `${BUTTON} bg-accent text-bg hover:brightness-110`;
const SECONDARY = `${BUTTON} border border-border text-text hover:border-accent hover:text-accent`;

/** Full-page resume view, laid out like a project case study: a header with
 * a back link, and the PDF shown inline inside the site's code-window chrome.
 * Where the device cannot show it inline, the same window offers it to open or save. */
export function ResumeViewer({ onBack }: ResumeViewerProps) {
  const { profile, ui } = useContent();
  const [inline] = useState(canShowPdfInline);
  const t = ui.resumeView;

  const open = (
    <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className={SECONDARY}>
      <ExternalLink size={14} aria-hidden="true" />
      {t.open}
    </a>
  );
  const download = (
    <a href={profile.resumeUrl} download className={PRIMARY}>
      <Download size={14} aria-hidden="true" />
      {t.download}
    </a>
  );

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
                {inline ? (
                  <>
                    <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border px-3 py-2">
                      {open}
                      {download}
                    </div>
                    <object
                      data={`${profile.resumeUrl}#view=FitH`}
                      type="application/pdf"
                      aria-label={ui.labels.resume}
                      className="flex-1 min-h-0 w-full bg-white"
                    >
                      <div className="p-8 text-center text-sm text-muted">
                        <p>{t.fallback}</p>
                      </div>
                    </object>
                  </>
                ) : (
                  <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4 overflow-y-auto p-8 text-center">
                    <FileText size={44} className="text-accent" aria-hidden="true" />
                    <p className="max-w-xs text-sm text-muted">{t.mobileHint}</p>
                    <div className="flex w-full max-w-xs flex-col gap-3">
                      {download}
                      {open}
                    </div>
                  </div>
                )}
              </CodeWindow>
            </Reveal>
          </div>
        </main>
      )}
    </ViewModal>
  );
}

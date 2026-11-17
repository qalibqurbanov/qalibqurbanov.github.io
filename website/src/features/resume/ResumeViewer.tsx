import { Panel } from "@/components/ui/Panel";
import { Reveal } from "@/components/ui/Reveal";
import { ViewModal } from "@/components/ui/ViewModal";
import { useContent } from "@/i18n/context";

import { PdfPages } from "./PdfPages";

interface ResumeViewerProps {
  onBack: () => void;
}

/** The résumé in a dialog: its pages as white sheets on the dark page, drawn by the site's own viewer, so
 * every browser and every phone shows it the same way, without the browser's PDF controls. */
export function ResumeViewer({ onBack }: ResumeViewerProps) {
  const { profile, ui } = useContent();
  const t = ui.resumeView;

  return (
    <ViewModal title={ui.labels.resume} widthClass="max-w-3xl" onClose={onBack}>
      {(close) => (
        <main className="min-h-0 flex-1">
          <div className="h-full">
            <Reveal className="flex h-full min-h-0 flex-col">
              <Panel title={ui.labels.resume} className="flex h-full min-h-0 flex-col" onClose={close}>
                <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-bg p-2 sm:p-3">
                  <PdfPages url={profile.resumeUrl} label={ui.labels.resume} failedText={t.fallback} openText={t.open} />
                </div>
              </Panel>
            </Reveal>
          </div>
        </main>
      )}
    </ViewModal>
  );
}

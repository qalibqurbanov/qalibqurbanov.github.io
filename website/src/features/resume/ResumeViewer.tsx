import type { UIEvent } from "react";
import { useRef, useState } from "react";

import { DownloadDrawIcon, FileDrawIcon, OpenDrawIcon, PrintDrawIcon } from "@/components/icons/DrawIcons";
import { Panel } from "@/components/ui/Panel";
import { PILL_BLUE, PILL_PURPLE } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/Reveal";
import { ViewModal } from "@/components/ui/ViewModal";
import { useContent } from "@/i18n/context";

import { PdfPages } from "./PdfPages";

/** Prints the pages as they are drawn in the viewer, one picture per sheet, from a frame that is out of sight, so the browser's own PDF
 * viewer is not needed and every browser prints the same thing. */
function printSheets(canvases: HTMLCanvasElement[], title: string) {
  if (canvases.length === 0) return;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0;visibility:hidden";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }
  const sheets = canvases.map((canvas) => `<img src="${canvas.toDataURL("image/png")}" alt="">`).join("");
  doc.open();
  doc.write(`<!doctype html><title>${title}</title><style>@page{margin:0}html,body{margin:0;background:#fff}img{display:block;width:100%;height:auto;break-after:page}img:last-child{break-after:auto}</style>${sheets}`);
  doc.close();
  const images = Array.from(doc.images);
  void Promise.all(images.map((image) => image.decode().catch(() => undefined))).then(() => {
    win.addEventListener("afterprint", () => frame.remove(), { once: true });
    win.focus();
    win.print();
    window.setTimeout(() => frame.remove(), 60000);
  });
}

interface ResumeViewerProps {
  onBack: () => void;
}

/** The résumé in a dialog of the left menu card's glass: a title row with the file icon (drawn again when its button is pointed at), the page
 * you are on, and three buttons: download, print, and open in a tab. Below, its pages as white sheets on the dark page, drawn by
 * the site's own viewer, so every browser and every phone shows it the same way, without the browser's PDF controls. */
export function ResumeViewer({ onBack }: ResumeViewerProps) {
  const { profile, ui } = useContent();
  const t = ui.resumeView;
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // The page you are on is the last one whose top has come into the upper part of the window.
  const track = (event: UIEvent<HTMLDivElement>) => {
    const box = event.currentTarget;
    const line = box.getBoundingClientRect().top + box.clientHeight * 0.4;
    let current = 1;
    box.querySelectorAll("canvas").forEach((canvas, index) => {
      if (canvas.getBoundingClientRect().top <= line) current = index + 1;
    });
    setPage(current);
  };

  // A sheet that is still being drawn has the browser's default size (300 by 150); printing waits, for a few seconds at most, until none is left.
  const print = (tries = 0) => {
    const canvases = Array.from(scrollRef.current?.querySelectorAll("canvas") ?? []);
    const drawing = canvases.some((canvas) => canvas.width === 300 && canvas.height === 150);
    if (drawing && tries < 20) {
      window.setTimeout(() => print(tries + 1), 200);
      return;
    }
    printSheets(canvases, ui.labels.resume);
  };

  const actions = (
    <>
      <a href={profile.resumeUrl} download className={`${PILL_BLUE} h-[1.625rem]!`} aria-label={t.download} title={t.download}>
        <DownloadDrawIcon />
        <span className="hidden md:inline">{t.download}</span>
      </a>
      <button type="button" onClick={() => print()} disabled={pages === 0} className={`${PILL_PURPLE} h-[1.625rem]! pointer-coarse:hidden! max-lg:hidden! disabled:cursor-default disabled:opacity-40`} aria-label={t.print} title={t.print}>
        <PrintDrawIcon />
        <span className="hidden md:inline">{t.print}</span>
      </button>
      <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className={`${PILL_BLUE} h-[1.625rem]!`} aria-label={t.open} title={t.open}>
        <OpenDrawIcon />
        <span className="hidden lg:inline">{t.open}</span>
      </a>
    </>
  );

  return (
    <ViewModal title={ui.labels.resume} widthClass="max-w-3xl" onClose={onBack}>
      {(close) => (
        <main className="min-h-0 flex-1">
          <div className="h-full">
            <Reveal className="flex h-full min-h-0 flex-col">
              <Panel
                title={ui.labels.resume}
                glass
                icon={<FileDrawIcon size={14} />}
                meta={pages > 0 ? `PDF · ${page} / ${pages}` : "PDF"}
                actions={actions}
                className="flex h-full min-h-0 flex-col"
                onClose={close}
              >
                <div ref={scrollRef} onScroll={track} className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
                  <PdfPages url={profile.resumeUrl} label={ui.labels.resume} failedText={t.fallback} openText={t.open} onLoaded={setPages} />
                </div>
              </Panel>
            </Reveal>
          </div>
        </main>
      )}
    </ViewModal>
  );
}

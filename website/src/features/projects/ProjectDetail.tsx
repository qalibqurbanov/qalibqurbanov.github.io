import { ArrowLeft, ArrowRight, Check, Download, ExternalLink, FileText, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { GithubIcon } from "@/components/icons/BrandIcons";
import { CodeWindow } from "@/components/ui/CodeWindow";
import { FileIcon } from "@/components/ui/FileIcon";
import { Reveal } from "@/components/ui/Reveal";
import { Tag } from "@/components/ui/Tag";
import { TAB_ACTIVE, TAB_BASE, TAB_IDLE } from "@/components/ui/tabStyles";
import { ViewModal } from "@/components/ui/ViewModal";
import { projectHref, useProjectRoute } from "@/hooks/useProjectRoute";
import { useContent } from "@/i18n/context";
import { isDownloadUrl } from "@/lib/projectLinks";
import { filenameFor } from "@/lib/projectFilename";
import type { Project } from "@/types/content";

interface ProjectDetailProps {
  project: Project | null;
  onBack: () => void;
}

type DetailTab = "overview" | "case";

const CASE_FILE = "case-study.md";
const COPIED_MS = 1800;

function DetailSection({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-6 first:mt-0">
      <p className="font-mono text-xs text-accent mb-1.5">{label}</p>
      <p className="text-muted text-sm leading-relaxed">{text}</p>
    </div>
  );
}

/** The case-study window: an editor with an overview tab and (when the project
 * has one) a case-study tab, and a bar underneath for stepping to the previous
 * and next project — also with the arrow keys. */
function ProjectWindow({ project, onClose }: { project: Project; onClose: () => void }) {
  const { ui, projects } = useContent();
  const { openProject } = useProjectRoute();
  const [tab, setTab] = useState<DetailTab>("overview");
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);

  const hasCase = Boolean(project.problem || project.approach || project.outcome);
  const index = projects.findIndex((item) => item.slug === project.slug);
  const count = projects.length;
  const prev = count > 1 ? projects[(index - 1 + count) % count] : null;
  const next = count > 1 ? projects[(index + 1) % count] : null;
  const prevSlug = prev?.slug;
  const nextSlug = next?.slug;
  const download = isDownloadUrl(project.liveUrl);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  // ← / → step through the projects, unless the keys belong to something else.
  useEffect(() => {
    if (!prevSlug || !nextSlug) return;
    const previous = prevSlug;
    const following = nextSlug;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"], [role="tab"]')) {
        return;
      }
      if (event.key === "ArrowLeft") openProject(previous);
      else if (event.key === "ArrowRight") openProject(following);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevSlug, nextSlug, openProject]);

  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}${projectHref(project.slug)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
  }

  function handleTabKeyDown(event: React.KeyboardEvent) {
    if (!hasCase || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    const nextTab = tab === "overview" ? "case" : "overview";
    setTab(nextTab);
    document.getElementById(`project-tab-${nextTab}`)?.focus();
  }

  const tabs = hasCase ? (
    <>
      <button
        id="project-tab-overview"
        type="button"
        role="tab"
        aria-selected={tab === "overview"}
        aria-controls="project-panel"
        tabIndex={tab === "overview" ? 0 : -1}
        onClick={() => setTab("overview")}
        onKeyDown={handleTabKeyDown}
        className={`${TAB_BASE} gap-1.5 px-3 py-2 ${tab === "overview" ? TAB_ACTIVE : TAB_IDLE}`}
      >
        <FileIcon />
        {filenameFor(project, 0)}
      </button>
      <button
        id="project-tab-case"
        type="button"
        role="tab"
        aria-selected={tab === "case"}
        aria-controls="project-panel"
        tabIndex={tab === "case" ? 0 : -1}
        onClick={() => setTab("case")}
        onKeyDown={handleTabKeyDown}
        className={`${TAB_BASE} gap-1.5 px-3 py-2 ${tab === "case" ? TAB_ACTIVE : TAB_IDLE}`}
      >
        <FileText size={12} className="shrink-0" />
        {CASE_FILE}
      </button>
    </>
  ) : undefined;

  const footer =
    prev && next ? (
      <div className="grid shrink-0 grid-cols-2 gap-4 border-t border-border bg-surface-2/60 px-4 py-2.5 font-mono text-xs text-muted">
        <button
          type="button"
          onClick={() => openProject(prev.slug)}
          aria-label={`${ui.projectDetail.prev}: ${prev.title}`}
          className="group flex items-center justify-self-start gap-2 text-left transition-colors hover:text-accent"
        >
          <ArrowLeft size={14} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
          <span>{ui.projectDetail.prev}</span>
        </button>
        <button
          type="button"
          onClick={() => openProject(next.slug)}
          aria-label={`${ui.projectDetail.next}: ${next.title}`}
          className="group flex items-center justify-self-end gap-2 text-right transition-colors hover:text-accent"
        >
          <span>{ui.projectDetail.next}</span>
          <ArrowRight size={14} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    ) : undefined;

  return (
    <CodeWindow
      filename={filenameFor(project, 0)}
      tabs={tabs}
      footer={footer}
      className="flex flex-col min-h-0 max-h-full"
      onClose={onClose}
    >
      <div
        ref={scrollRef}
        id="project-panel"
        role={hasCase ? "tabpanel" : undefined}
        aria-labelledby={hasCase ? `project-tab-${tab}` : undefined}
        className="custom-scrollbar p-8 flex-1 overflow-y-auto min-h-0"
      >
        {tab === "overview" || !hasCase ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <h1 className="min-w-0 flex-1 text-3xl font-bold tracking-tight">{project.title}</h1>
              <div className="flex flex-wrap gap-3 shrink-0">
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border font-mono text-sm hover:border-accent hover:text-accent transition"
                >
                  <GithubIcon size={16} />
                  {ui.projectDetail.viewRepo}
                </a>
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-bg font-mono text-sm font-medium hover:brightness-110 transition"
                >
                  {download ? <Download size={16} /> : <ExternalLink size={16} />}
                  {download ? ui.projectDetail.viewDownload : ui.projectDetail.viewLive}
                </a>
                <div className="relative">
                  <button
                    type="button"
                    onClick={copyLink}
                    aria-label={ui.projectDetail.copyLink}
                    title={ui.projectDetail.copyLink}
                    className={`inline-flex items-center justify-center px-3 py-2 rounded-md border transition-colors ${
                      copied
                        ? "border-accent text-accent"
                        : "border-border text-muted hover:border-accent hover:text-accent"
                    }`}
                  >
                    {copied ? <Check size={16} /> : <Link2 size={16} />}
                  </button>
                  {copied && (
                    <span
                      role="status"
                      className="animate-popover-in pointer-events-none absolute right-0 top-full z-10 mt-3 flex select-none items-center gap-2 whitespace-nowrap rounded-lg border border-accent/40 bg-surface px-3 py-2 font-mono text-xs text-text shadow-xl shadow-black/30"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute -top-1.5 right-[15px] h-3 w-3 rotate-45 border-l border-t border-accent/40 bg-surface"
                      />
                      <Check size={13} strokeWidth={2.5} className="shrink-0 text-accent" />
                      {ui.projectDetail.linkCopied}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-muted mt-4 leading-relaxed">{project.description}</p>

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
          </>
        ) : (
          <>
            {project.problem && <DetailSection label={ui.projectDetail.problemLabel} text={project.problem} />}
            {project.approach && <DetailSection label={ui.projectDetail.approachLabel} text={project.approach} />}
            {project.outcome && <DetailSection label={ui.projectDetail.outcomeLabel} text={project.outcome} />}
          </>
        )}
      </div>
    </CodeWindow>
  );
}

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const { ui } = useContent();

  return (
    <ViewModal
      backLabel={ui.projectDetail.back}
      title={project?.title ?? ui.projectDetail.notFoundTitle}
      widthClass="max-w-4xl"
      onClose={onBack}
    >
      {(close) => (
        <main className="flex-1 min-h-0">
          <div className="h-full">
            {!project ? (
              <div className="text-center py-24">
                <h1 className="text-2xl font-semibold">{ui.projectDetail.notFoundTitle}</h1>
                <p className="text-muted mt-3">{ui.projectDetail.notFoundBody}</p>
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    close();
                  }}
                  className="inline-block mt-8 rounded-md px-6 py-3 bg-accent text-bg font-mono text-sm font-medium hover:brightness-110 transition"
                >
                  {ui.projectDetail.backHome}
                </a>
              </div>
            ) : (
              /* Capped to the space between the header and viewport bottom
                 (via the h-full chain above) instead of letting the page
                 itself grow — the content scrolls inside the window when it's
                 taller than that, so the header and footer stay put. Keyed by
                 project so stepping to the next one plays the entrance again
                 and starts back on the overview tab. */
              <Reveal key={project.slug} className="h-full flex flex-col min-h-0">
                <ProjectWindow project={project} onClose={close} />
              </Reveal>
            )}
          </div>
        </main>
      )}
    </ViewModal>
  );
}

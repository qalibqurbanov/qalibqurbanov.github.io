import { ArrowLeft, ArrowRight, Check, Download, ExternalLink, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { GithubIcon } from "@/components/icons/BrandIcons";
import { Panel } from "@/components/ui/Panel";
import { Reveal } from "@/components/ui/Reveal";
import { ViewModal } from "@/components/ui/ViewModal";
import { projectHref, useProjectRoute } from "@/hooks/useProjectRoute";
import { useContent } from "@/i18n/context";
import { isDownloadUrl } from "@/lib/projectLinks";
import type { Project } from "@/types/content";

interface ProjectDetailProps {
  project: Project | null;
  onBack: () => void;
}

type DetailTab = "overview" | "case";

const COPIED_MS = 1800;

const TAB = "cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors";
const TAB_ACTIVE = "bg-surface-2 font-medium text-text";
const TAB_IDLE = "text-muted hover:text-text";

const BUTTON = "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors";

function DetailSection({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-6 first:mt-0">
      <h2 className="mb-1.5 text-sm font-semibold text-accent">{label}</h2>
      <p className="text-[0.9375rem] leading-relaxed text-muted">{text}</p>
    </div>
  );
}

/** The case-study panel: an overview, and (when the project has one) a case-study tab, with a bar
 * underneath for stepping to the previous and next project, also with the arrow keys. */
function ProjectPanel({ project, onClose }: { project: Project; onClose: () => void }) {
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
    const url = `${window.location.origin}${projectHref(project.slug)}`;
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
      {(["overview", "case"] as const).map((id) => (
        <button
          key={id}
          id={`project-tab-${id}`}
          type="button"
          role="tab"
          aria-selected={tab === id}
          aria-controls="project-panel"
          tabIndex={tab === id ? 0 : -1}
          onClick={() => setTab(id)}
          onKeyDown={handleTabKeyDown}
          className={`${TAB} ${tab === id ? TAB_ACTIVE : TAB_IDLE}`}
        >
          {id === "overview" ? ui.projectDetail.overviewTab : ui.projectDetail.caseTab}
        </button>
      ))}
    </>
  ) : undefined;

  const footer =
    prev && next ? (
      <div className="grid shrink-0 grid-cols-2 gap-4 border-t border-border bg-surface-2/60 px-4 py-3 text-sm text-muted">
        <button
          type="button"
          onClick={() => openProject(prev.slug)}
          aria-label={`${ui.projectDetail.prev}: ${prev.title}`}
          className="group flex cursor-pointer items-center justify-self-start gap-2 text-left transition-colors hover:text-accent"
        >
          <ArrowLeft size={15} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
          <span>{ui.projectDetail.prev}</span>
        </button>
        <button
          type="button"
          onClick={() => openProject(next.slug)}
          aria-label={`${ui.projectDetail.next}: ${next.title}`}
          className="group flex cursor-pointer items-center justify-self-end gap-2 text-right transition-colors hover:text-accent"
        >
          <span>{ui.projectDetail.next}</span>
          <ArrowRight size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    ) : undefined;

  return (
    <Panel title={project.kind} tabs={tabs} footer={footer} className="flex max-h-full min-h-0 flex-col" onClose={onClose}>
      <div
        ref={scrollRef}
        id="project-panel"
        role={hasCase ? "tabpanel" : undefined}
        aria-labelledby={hasCase ? `project-tab-${tab}` : undefined}
        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6 sm:p-8"
      >
        {tab === "overview" || !hasCase ? (
          <>
            <p className="label">{project.kind}</p>
            <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="min-w-0 flex-1 text-3xl font-semibold tracking-tight">{project.title}</h1>
              <div className="flex shrink-0 flex-wrap gap-3">
                <a href={project.repoUrl} target="_blank" rel="noreferrer" className={`${BUTTON} btn-line`}>
                  <GithubIcon size={16} />
                  {ui.projectDetail.viewRepo}
                </a>
                <a href={project.liveUrl} target="_blank" rel="noreferrer" className={`${BUTTON} btn-solid`}>
                  {download ? <Download size={16} /> : <ExternalLink size={16} />}
                  {download ? ui.projectDetail.viewDownload : ui.projectDetail.viewLive}
                </a>
                <div className="relative">
                  <button
                    type="button"
                    onClick={copyLink}
                    aria-label={ui.projectDetail.copyLink}
                    title={ui.projectDetail.copyLink}
                    className={`inline-flex h-full cursor-pointer items-center justify-center rounded-md border px-3 py-2 transition-colors ${
                      copied ? "border-accent text-accent" : "border-border text-muted hover:border-accent hover:text-accent"
                    }`}
                  >
                    {copied ? <Check size={16} /> : <Link2 size={16} />}
                  </button>
                  {copied && (
                    <span
                      role="status"
                      className="animate-popover-in pointer-events-none absolute right-0 top-full z-10 mt-2 flex select-none items-center gap-2 whitespace-nowrap rounded-md border border-border bg-surface px-3 py-2 text-xs text-text shadow-lg shadow-black/20"
                    >
                      <Check size={13} strokeWidth={2.5} className="shrink-0 text-accent" />
                      {ui.projectDetail.linkCopied}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{project.description}</p>

            {project.stack && project.stack.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold text-accent">{ui.projectDetail.stackLabel}</h2>
                <p className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.8125rem] text-muted">
                  {project.stack.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </p>
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
    </Panel>
  );
}

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const { ui } = useContent();

  return (
    <ViewModal title={project?.title ?? ui.projectDetail.notFoundTitle} widthClass="max-w-4xl" onClose={onBack}>
      {(close) => (
        <main className="min-h-0 flex-1">
          <div className="h-full">
            {!project ? (
              <div className="py-24 text-center">
                <h1 className="text-2xl font-semibold">{ui.projectDetail.notFoundTitle}</h1>
                <p className="mt-3 text-muted">{ui.projectDetail.notFoundBody}</p>
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    close();
                  }}
                  className="btn-solid mt-8 inline-block px-6 py-3 text-sm font-medium"
                >
                  {ui.projectDetail.backHome}
                </a>
              </div>
            ) : (
              /* Capped to the space between the header and the bottom of the screen: the content
                 scrolls inside the panel when it is taller, so the tabs and the footer stay put.
                 Keyed by project so stepping to the next one plays the entrance again and starts
                 back on the overview tab. */
              <Reveal key={project.slug} className="flex h-full min-h-0 flex-col">
                <ProjectPanel project={project} onClose={close} />
              </Reveal>
            )}
          </div>
        </main>
      )}
    </ViewModal>
  );
}

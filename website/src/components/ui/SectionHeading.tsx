import { Link2 } from "lucide-react";

import { GlitchRule } from "@/components/ui/GlitchRule";
import { GlitchText } from "@/components/ui/GlitchText";
import { Reveal } from "@/components/ui/Reveal";
import { useContent } from "@/i18n/context";
import { showToast } from "@/lib/effects";

interface SectionHeadingProps {
  /** Id of the section this heading belongs to; the title links to it. */
  id: string;
  index: string;
  title: string;
}

export function SectionHeading({ id, index, title }: SectionHeadingProps) {
  const { ui } = useContent();

  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    showToast(`${ui.sectionLink.copied}: ${url}`, 2800, true);
  }

  return (
    <Reveal replay className="section-heading mb-12">
      <p className="font-mono text-sm mb-2">
        <span className="text-muted">{"// "}</span>
        <span className="text-accent">{index}</span>
      </p>
      <div className="flex items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-semibold whitespace-nowrap">
          <a
            href={`#${id}`}
            className="cursor-pointer transition-colors hover:text-accent"
          >
            <GlitchText text={title} onEnter decode />
          </a>
          <span className="text-accent-2">()</span>
          <button
            type="button"
            onClick={copyLink}
            aria-label={ui.sectionLink.copy}
            title={ui.sectionLink.copy}
            className="section-copy ml-3 inline-flex cursor-pointer align-middle text-muted hover:text-accent"
          >
            <Link2 size={18} />
          </button>
        </h2>
        <GlitchRule />
        <span className="hidden sm:inline font-mono text-muted/60 text-2xl leading-none bracket-pulse">
          {"{"}
        </span>
      </div>
    </Reveal>
  );
}

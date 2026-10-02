import { GlitchRule } from "@/components/ui/GlitchRule";
import { GlitchText } from "@/components/ui/GlitchText";
import { Reveal } from "@/components/ui/Reveal";

interface SectionHeadingProps {
  /** Id of the section this heading belongs to; the title links to it. */
  id: string;
  index: string;
  title: string;
}

export function SectionHeading({ id, index, title }: SectionHeadingProps) {
  return (
    <Reveal replay className="mb-12">
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
        </h2>
        <GlitchRule />
        <span className="hidden sm:inline font-mono text-muted/60 text-2xl leading-none bracket-pulse">
          {"{"}
        </span>
      </div>
    </Reveal>
  );
}

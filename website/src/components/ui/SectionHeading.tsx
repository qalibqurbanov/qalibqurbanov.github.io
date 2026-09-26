import { Reveal } from "@/components/ui/Reveal";

interface SectionHeadingProps {
  index: string;
  title: string;
}

export function SectionHeading({ index, title }: SectionHeadingProps) {
  return (
    <Reveal className="mb-12">
      <p className="font-mono text-sm mb-2">
        <span className="text-muted">{"// "}</span>
        <span className="text-accent">{index}</span>
      </p>
      <div className="flex items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-semibold whitespace-nowrap">
          {title}
          <span className="text-accent-2">()</span>
        </h2>
        <span className="h-px bg-border flex-1" />
        <span className="hidden sm:inline font-mono text-muted/60 text-2xl leading-none">{"{"}</span>
      </div>
    </Reveal>
  );
}

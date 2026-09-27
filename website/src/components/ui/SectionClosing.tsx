/** Closes the `{` opened by SectionHeading, so each section's code-block motif is balanced. */
export function SectionClosing() {
  return (
    <div className="mt-16 flex items-center gap-4" aria-hidden="true">
      <span className="font-mono text-muted/60 text-2xl leading-none select-none bracket-pulse">
        {"}"}
      </span>
      <span className="h-px flex-1 scan-line" />
    </div>
  );
}

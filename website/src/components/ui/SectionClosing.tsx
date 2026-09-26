/** Closes the `{` opened by SectionHeading, so each section's code-block motif is balanced. */
export function SectionClosing() {
  return (
    <p className="mt-16 font-mono text-muted/60 text-2xl leading-none select-none" aria-hidden="true">
      {"}"}
    </p>
  );
}

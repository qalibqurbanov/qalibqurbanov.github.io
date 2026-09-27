/** Fixed, blurred glow blobs drifting slowly behind the whole page — the
 * ambient motion that keeps the site feeling alive between sections. */
export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-accent-2/10 blur-3xl blob-drift-a" />
      <div className="absolute bottom-[-15%] -right-24 w-[560px] h-[560px] rounded-full bg-accent/10 blur-3xl blob-drift-b" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full bg-accent/5 blur-3xl blob-drift-a"
        style={{ animationDelay: "-9s" }}
      />
    </div>
  );
}

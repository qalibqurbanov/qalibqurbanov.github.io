import { OPEN_COMMAND_PALETTE_EVENT } from "@/components/command-palette/openPalette";

/** A small ">_" prompt button that opens the command palette from anywhere it's rendered. */
export function CommandPaletteTrigger({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
      aria-label={label}
      title={`${label} (Alt+C)`}
      className="hidden md:inline-flex h-7 w-7 items-center justify-center rounded border border-border font-mono text-xs text-muted transition-colors hover:border-accent/60 hover:text-accent"
    >
      {">_"}
    </button>
  );
}

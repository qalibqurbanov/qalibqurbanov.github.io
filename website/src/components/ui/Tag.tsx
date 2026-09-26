interface TagProps {
  children: string;
}

export function Tag({ children }: TagProps) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-md bg-surface-2 border border-border text-muted">
      <span className="text-accent">#</span>
      {children}
    </span>
  );
}

import { useContent } from "@/i18n/context";
import { getInitials } from "@/lib/initials";

interface FileIconProps {
  className?: string;
}

/** A small badge with the site owner's initials, shown in every "code window" title bar. */
export function FileIcon({ className = "" }: FileIconProps) {
  const { profile } = useContent();

  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-[4px] bg-surface-2 border border-border text-[8px] font-mono font-bold leading-none text-gradient shrink-0 ${className}`}
      aria-hidden="true"
    >
      {getInitials(profile.name)}
    </span>
  );
}

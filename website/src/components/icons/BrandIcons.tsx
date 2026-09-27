// lucide-react dropped brand/logo icons, so GitHub and LinkedIn are
// small hand-rolled SVGs (same 24x24, fill style as their brand marks).

interface BrandIconProps {
  size?: number;
  className?: string;
}

export function GithubIcon({ size = 20, className = "" }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.04 11.04 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.67.79.56A10.51 10.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

export function LinkedinIcon({ size = 20, className = "" }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

export function TelegramIcon({ size = 20, className = "" }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.5 2.5 20 21.4c-.26 1.16-.96 1.44-1.94.9l-5.36-3.95-2.59 2.49c-.29.29-.53.53-1.08.53l.38-5.46L19.3 6.3c.42-.37-.1-.58-.65-.21L6.4 13.9l-5.32-1.66c-1.16-.36-1.18-1.16.24-1.72L22.05.98c.96-.36 1.8.22 1.45 1.52Z" />
    </svg>
  );
}

/** Medium's mark is a large circle plus two narrowing vertical ellipses —
 * the classic three-shape "M" glyph, simple enough to draw with primitives
 * instead of an approximated path. */
export function MediumIcon({ size = 20, className = "" }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="6.5" cy="12" r="5.5" />
      <ellipse cx="15.8" cy="12" rx="3" ry="5.5" />
      <ellipse cx="21.5" cy="12" rx="1.3" ry="5.2" />
    </svg>
  );
}

/** Stack Overflow's mark is a stack of widening slanted bars over a base —
 * approximated here with polygons rather than a traced path. */
export function StackOverflowIcon({ size = 20, className = "" }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="5" y="18" width="14" height="2.3" rx="0.3" />
      <polygon points="9,4.6 16,10.7 14.8,12.1 7.8,6" />
      <polygon points="7.7,8 17,12.6 16.2,14.2 6.9,9.6" />
      <polygon points="6.6,11.6 17.9,14.4 17.4,16.2 6.1,13.4" />
      <polygon points="6,15.3 18.3,17.1 18,18.9 5.7,17.1" />
    </svg>
  );
}

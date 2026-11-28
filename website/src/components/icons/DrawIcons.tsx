/** The site's own icons for its buttons and dialogs (the buttons under my name, the dialogs' title icons and buttons, and the phone's menu
 * button, whose lines turn into a cross). */
interface Props {
  size?: number;
}

function Frame({ size = 14, children, className }: Props & { children: React.ReactNode; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function FileDrawIcon({ size }: Props) {
  return (
    <Frame size={size}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </Frame>
  );
}

export function SendDrawIcon({ size }: Props) {
  return (
    <Frame size={size}>
      <path d="M14.5 21.7a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.64l-19 6.5a.5.5 0 0 0-.03.94l7.9 3.2a2 2 0 0 1 1.1 1.1Z" />
      <path d="m21.85 2.15-10.9 10.9" />
    </Frame>
  );
}

export function DownloadDrawIcon({ size }: Props) {
  return (
    <Frame size={size}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M12 15V3" />
      <path d="m7 10 5 5 5-5" />
    </Frame>
  );
}

export function OpenDrawIcon({ size }: Props) {
  return (
    <Frame size={size}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </Frame>
  );
}

export function PrintDrawIcon({ size }: Props) {
  return (
    <Frame size={size}>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </Frame>
  );
}

/** The menu button's icon: three lines that turn into a cross when the menu opens, and back into three lines when it shuts (see `.menu-icon` in
 * sidebar-card.css): the top and bottom lines swing into the two strokes of the cross while the middle one draws in on itself. It is the size and
 * weight of the settings icon beside it. */
export function MenuDrawIcon({ open, size = 21 }: Props & { open: boolean }) {
  return (
    <Frame size={size} className={`menu-icon${open ? " is-open" : ""}`}>
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </Frame>
  );
}

/** An open book, for the article dialog. */
export function BookDrawIcon({ size }: Props) {
  return (
    <Frame size={size}>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </Frame>
  );
}

/** Angle brackets with a slash, for the project dialog. */
export function CodeDrawIcon({ size }: Props) {
  return (
    <Frame size={size}>
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
    </Frame>
  );
}

/** The file and send icons of the two buttons under the title, drawn as separate strokes so each can be drawn again, one after another,
 * when the button is pointed at (see `.btn-draw` in sidebar-card.css). Each stroke has `pathLength="1"` and its own start delay (`--d`). */
interface Props {
  size?: number;
}

function Frame({ size = 14, children }: Props & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const delay = (n: number) => ({ "--d": n }) as React.CSSProperties;

export function FileDrawIcon({ size }: Props) {
  return (
    <Frame size={size}>
      <path pathLength={1} style={delay(0)} d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path pathLength={1} style={delay(3)} d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path pathLength={1} style={delay(4)} d="M10 9H8" />
      <path pathLength={1} style={delay(5)} d="M16 13H8" />
      <path pathLength={1} style={delay(6)} d="M16 17H8" />
    </Frame>
  );
}

export function SendDrawIcon({ size }: Props) {
  return (
    <Frame size={size}>
      <path pathLength={1} style={delay(0)} d="M14.5 21.7a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.64l-19 6.5a.5.5 0 0 0-.03.94l7.9 3.2a2 2 0 0 1 1.1 1.1Z" />
      <path pathLength={1} style={delay(4)} d="m21.85 2.15-10.9 10.9" />
    </Frame>
  );
}

export function DownloadDrawIcon({ size }: Props) {
  return (
    <Frame size={size}>
      <path pathLength={1} style={delay(0)} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path pathLength={1} style={delay(3)} d="M12 15V3" />
      <path pathLength={1} style={delay(4)} d="m7 10 5 5 5-5" />
    </Frame>
  );
}

export function OpenDrawIcon({ size }: Props) {
  return (
    <Frame size={size}>
      <path pathLength={1} style={delay(0)} d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path pathLength={1} style={delay(3)} d="M15 3h6v6" />
      <path pathLength={1} style={delay(4)} d="M10 14 21 3" />
    </Frame>
  );
}

export function PrintDrawIcon({ size }: Props) {
  return (
    <Frame size={size}>
      <path pathLength={1} style={delay(0)} d="M6 9V2h12v7" />
      <path pathLength={1} style={delay(2)} d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path pathLength={1} style={delay(5)} d="M6 14h12v8H6z" />
    </Frame>
  );
}

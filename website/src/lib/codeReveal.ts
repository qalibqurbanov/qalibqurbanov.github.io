import { CODE_CHUNKS, logLines, tokenize } from "@/lib/codeBackdrop";

/** What the 404 page's cursor light uncovers (see CursorGlow): a layer of source code that stays where
 * it is while the light moves over it. Each burst of signal loss (lib/effects.ts) changes what is
 * written there: the old text turns to noise and settles into the next slice, line by line. A slice
 * is a run of whole members of the listing that fills the screen, or now and then a stretch of
 * server log for the address that was not found. Nothing runs between bursts. */

const NOISE = "#%&$@?/\\<>[]{}=+*0123456789";
/** Matches the layer's line height in CSS. */
const LINE_PX = 18;
const TRANSITION_MS = 560;
/** The share of the transition after which a line has finished (the rest is the spread of start times). */
const SPREAD = 0.45;
/** How likely a log follows a stretch of code. */
const LOG_CHANCE = 0.34;

function scramble(text: string, share: number): string {
  let out = "";
  for (const ch of text) out += ch !== " " && Math.random() < share ? NOISE[Math.floor(Math.random() * NOISE.length)] : ch;
  return out;
}

export interface CodeReveal {
  burst: () => void;
  destroy: () => void;
}

export function createCodeReveal(layer: HTMLElement): CodeReveal {
  let lastKind: "code" | "log" = "log";
  let lastStart = -1;
  let current: string[] = [];
  let previous: string[] = [];
  let delays: number[] = [];
  let startedAt = 0;
  let frame = 0;

  const nextSlice = (): string[] => {
    // A slice always fills the screen's height, so the page is never left mostly empty.
    const capacity = Math.max(8, Math.floor((window.innerHeight - 28) / LINE_PX));
    const out: string[] = [];
    if (lastKind === "code" && Math.random() < LOG_CHANCE) {
      lastKind = "log";
      // One request after another, until the screen is full.
      while (out.length < capacity) {
        if (out.length) out.push("");
        out.push(...logLines(window.location.pathname));
      }
      return out.slice(0, capacity);
    }
    lastKind = "code";
    let start: number;
    do {
      start = Math.floor(Math.random() * CODE_CHUNKS.length);
    } while (start === lastStart && CODE_CHUNKS.length > 1);
    lastStart = start;
    // From the first member on, around the end of the file back to its start, taking every member that still fits.
    for (let n = 0; n < CODE_CHUNKS.length; n++) {
      const chunk = CODE_CHUNKS[(start + n) % CODE_CHUNKS.length];
      const needed = out.length ? out.length + 1 + chunk.length : chunk.length;
      if (out.length && needed > capacity) continue;
      if (out.length) out.push("");
      out.push(...chunk);
    }
    return out;
  };

  const rowAt = (i: number): HTMLElement => {
    while (layer.children.length <= i) layer.appendChild(document.createElement("div"));
    return layer.children[i] as HTMLElement;
  };

  /** One line, coloured. */
  const paintRow = (row: HTMLElement, line: string) => {
    row.textContent = "";
    if (!line) return;
    for (const piece of tokenize(line)) {
      if (piece.kind === "plain") row.appendChild(document.createTextNode(piece.text));
      else {
        const span = document.createElement("span");
        span.className = `cg-${piece.kind}`;
        span.textContent = piece.text;
        row.appendChild(span);
      }
    }
  };

  const paintAll = (lines: string[]) => {
    for (let i = 0; i < Math.max(lines.length, layer.children.length); i++) paintRow(rowAt(i), lines[i] ?? "");
  };

  const step = (now: number) => {
    const t = (now - startedAt) / TRANSITION_MS;
    if (t >= 1) {
      paintAll(current);
      frame = 0;
      return;
    }
    const rows = Math.max(previous.length, current.length);
    for (let i = 0; i < rows; i++) {
      // Each line starts at its own moment: first the old text breaks up, then the new text settles.
      const u = Math.min(1, Math.max(0, (t - delays[i]) / (1 - SPREAD)));
      if (u <= 0) continue;
      const row = rowAt(i);
      row.textContent = u < 0.4 ? scramble(previous[i] ?? "", u / 0.4) : scramble(current[i] ?? "", 1 - (u - 0.4) / 0.6);
    }
    frame = requestAnimationFrame(step);
  };

  const burst = () => {
    // A burst in the middle of a change starts from where that change was headed.
    previous = current;
    current = nextSlice();
    delays = Array.from({ length: Math.max(previous.length, current.length) }, () => Math.random() * SPREAD);
    startedAt = performance.now();
    if (!frame) frame = requestAnimationFrame(step);
  };

  current = nextSlice();
  paintAll(current);

  return {
    burst,
    destroy: () => {
      cancelAnimationFrame(frame);
      layer.textContent = "";
    },
  };
}

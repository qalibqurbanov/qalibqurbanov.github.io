import type { ReactNode } from "react";

const PAIRS: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
const CLOSERS = new Set(Object.values(PAIRS));
/** Matches `.bracket-N` in index.css. */
const DEPTH_COLORS = 3;

/** Splits text so every matched bracket pair is wrapped in a span coloured by
 * nesting depth. Brackets without a partner stay plain, so half-typed input
 * or prose like "1) first" is never mis-coloured. */
export function colorizeBrackets(text: string): ReactNode[] {
  const depthAt = new Map<number, number>();
  const stack: Array<{ closer: string; index: number }> = [];

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char in PAIRS) {
      stack.push({ closer: PAIRS[char], index });
    } else if (CLOSERS.has(char)) {
      const top = stack[stack.length - 1];
      if (top?.closer === char) {
        stack.pop();
        const depth = stack.length;
        depthAt.set(top.index, depth);
        depthAt.set(index, depth);
      }
    }
  }

  const nodes: ReactNode[] = [];
  let plainStart = 0;
  for (let index = 0; index < text.length; index++) {
    const depth = depthAt.get(index);
    if (depth === undefined) continue;
    if (index > plainStart) nodes.push(text.slice(plainStart, index));
    nodes.push(
      <span key={index} className={`bracket-${depth % DEPTH_COLORS}`}>
        {text[index]}
      </span>,
    );
    plainStart = index + 1;
  }
  if (plainStart < text.length) nodes.push(text.slice(plainStart));
  return nodes;
}

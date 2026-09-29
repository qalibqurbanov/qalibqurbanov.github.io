import type { ReactNode } from "react";

import { CodeWindow } from "@/components/ui/CodeWindow";

interface CodeBlockProps {
  filename: string;
  code: string;
}

const KEYWORDS = new Set([
  "const", "let", "var", "function", "async", "await", "return", "if", "else",
  "export", "import", "from", "throw", "new", "class", "interface", "type",
  "public", "private", "extends", "try", "catch", "for", "while", "of", "in",
  "default", "this", "true", "false", "null", "undefined",
]);

const TOKEN_REGEX =
  /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

/** A small, dependency-free tokenizer for the common JS/TS syntax patterns —
 * enough to give code snippets the same hand-rolled highlighting the rest of
 * the site already uses (see Hero's manually-colored spans), without pulling
 * in a full syntax-highlighting library for a handful of blog snippets. */
function highlightLine(line: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  TOKEN_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = TOKEN_REGEX.exec(line))) {
    if (match.index > lastIndex) {
      nodes.push(<span key={key++}>{line.slice(lastIndex, match.index)}</span>);
    }

    const [full, comment, string, number, word] = match;
    if (comment) {
      nodes.push(
        <span key={key++} className="text-muted/70 italic">
          {comment}
        </span>,
      );
    } else if (string) {
      nodes.push(
        <span key={key++} className="text-accent">
          {string}
        </span>,
      );
    } else if (number) {
      nodes.push(
        <span key={key++} className="text-accent-2">
          {number}
        </span>,
      );
    } else if (word) {
      nodes.push(
        <span key={key++} className={KEYWORDS.has(word) ? "text-accent-2" : "text-text"}>
          {word}
        </span>,
      );
    } else {
      nodes.push(<span key={key++}>{full}</span>);
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < line.length) {
    nodes.push(<span key={key++}>{line.slice(lastIndex)}</span>);
  }

  return nodes;
}

export function CodeBlock({ filename, code }: CodeBlockProps) {
  const lines = code.split("\n");

  return (
    <CodeWindow filename={filename} className="selectable">
      <div className="custom-scrollbar font-mono text-[13px] leading-6 py-4 overflow-x-auto">
        {lines.map((line, index) => (
          <div key={index} className="flex px-5">
            <span className="w-6 shrink-0 text-muted/50 select-none">{index + 1}</span>
            <span className="whitespace-pre">{highlightLine(line)}</span>
          </div>
        ))}
      </div>
    </CodeWindow>
  );
}

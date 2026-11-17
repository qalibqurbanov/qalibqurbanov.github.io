import type { ReactNode } from "react";

/** Inline markup: `**text**` is set heavier, `==text==` as a technical term in mono. */
export function renderEmphasis(text: string): ReactNode {
  return text
    .split(/(\*\*[^*]+\*\*|==[^=]+==)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-text">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("==") && part.endsWith("==")) {
        return (
          <code key={index} className="font-mono text-[0.85em] text-accent">
            {part.slice(2, -2)}
          </code>
        );
      }
      return <span key={index}>{part}</span>;
    });
}

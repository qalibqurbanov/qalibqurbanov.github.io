import type { ReactNode } from "react";

/** Inline markup: `**text**` is set heavier, `==text==` as a technical term in mono, and `[text](https://…)` as a link that opens in a new tab.
 * A link can sit inside a technical term: `==[GoldSrc](https://…)==` is a mono term that you can click. */
export function renderEmphasis(text: string): ReactNode {
  return text
    .split(/(\*\*[^*]+\*\*|==.+?==)/g)
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
            {renderLinks(part.slice(2, -2))}
          </code>
        );
      }
      return <span key={index}>{renderLinks(part)}</span>;
    });
}

/** `[text](url)` becomes a link to another site (the address may itself hold a pair of brackets, as in `…/Half-Life_(video_game)`), in a new tab, underlined softly and lit when pointed at. */
function renderLinks(text: string): ReactNode {
  return text.split(/(\[[^\]]+\]\(https?:\/\/(?:[^()\s]|\([^()\s]*\))+\))/g).map((part, index) => {
    const link = /^\[([^\]]+)\]\((https?:\/\/(?:[^()\s]|\([^()\s]*\))+)\)$/.exec(part);
    if (!link) return part;
    return (
      <a
        key={index}
        href={link[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-current/40 underline-offset-4 transition-[text-decoration-color,color] duration-200 hover:text-accent-2 hover:decoration-current"
      >
        {link[1]}
      </a>
    );
  });
}

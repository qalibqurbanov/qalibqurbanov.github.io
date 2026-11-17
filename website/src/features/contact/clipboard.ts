import { useEffect, useRef, useState } from "react";

/** Puts text on the clipboard. Where the modern call is refused (a page without focus, an older browser),
 * a hidden field and the old copy command do the same. Says whether it worked. */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.append(field);
    field.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      field.remove();
    }
  }
}

/** A copy button's state: `copied` is true for a moment after `copy()` worked. */
export function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  async function copy() {
    if (!(await writeClipboard(text))) return;
    setCopied(true);
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied(false), 1600);
  }

  return { copied, copy };
}

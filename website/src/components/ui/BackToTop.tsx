import { ArrowUp } from "lucide-react";

import { useContent } from "@/i18n/context";
import { useScrolledPast } from "@/hooks/useScrollPosition";
import { scrollToTop } from "@/lib/scroll";

export function BackToTop() {
  const { ui } = useContent();
  const visible = useScrolledPast(480);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      data-demolish-fixed=""
      aria-label={ui.backToTop}
      title={ui.backToTop}
      className={`fixed bottom-6 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-text hover:text-text focus-visible:border-text focus-visible:text-text focus-visible:outline-none ${
        visible
          ? "opacity-100 translate-y-0"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUp size={18} />
    </button>
  );
}

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
      aria-label={ui.backToTop}
      title={ui.backToTop}
      className={`fixed bottom-28 sm:bottom-20 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-lg shadow-black/10 backdrop-blur-md transition-all duration-300 hover:border-accent hover:text-accent hover:-translate-y-0.5 focus-visible:border-accent focus-visible:text-accent focus-visible:outline-none ${
        visible
          ? "opacity-100 translate-y-0"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUp size={18} />
    </button>
  );
}

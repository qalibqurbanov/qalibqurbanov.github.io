import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { setViewBar } from "@/components/ui/viewBar";
import { borderBurst } from "@/hooks/borderGlitch";
import { useContent } from "@/i18n/context";

/** Slightly longer than the CSS exit animation (180ms) so the view is still
 * mounted while it fades out. */
const EXIT_MS = 200;

interface ViewModalProps {
  /** Screen-reader title. Omit when the children render their own Dialog.Title. */
  title?: string;
  backLabel?: string;
  /** Tailwind max-width class for the window. */
  widthClass: string;
  onClose: () => void;
  open?: boolean;
  /** Receives `close`, which plays the exit animation before calling `onClose`. */
  children: ReactNode | ((close: () => void) => ReactNode);
}

/** Modal shell shared by the project, resume and contact views: the same
 * blurred, dimmed overlay everywhere. It has no bar of its own — it hands its
 * back action to the site's navbar (see viewBar.ts), which morphs into a
 * back-bar above the overlay while the view is open. */
export function ViewModal({
  title,
  backLabel,
  widthClass,
  onClose,
  open = true,
  children,
}: ViewModalProps) {
  const { ui } = useContent();
  const label = backLabel ?? ui.resumeView.back;
  const [closing, setClosing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const visible = open && !closing;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Closing plays the exit animation first; only then does the owner hide or unmount the view.
  useEffect(() => {
    if (!closing) return;
    const id = window.setTimeout(() => {
      setClosing(false);
      onCloseRef.current();
    }, EXIT_MS);
    return () => window.clearTimeout(id);
  }, [closing]);

  // The window's border glitches once as the view opens.
  useEffect(() => {
    if (!visible) return;
    const id = window.setTimeout(() => {
      const win = contentRef.current?.querySelector<HTMLElement>(".glitch-border");
      if (win) borderBurst(win, 8);
    }, 160);
    return () => window.clearTimeout(id);
  }, [visible]);

  const requestClose = useCallback(() => setClosing(true), []);

  useEffect(() => {
    if (!visible) return;
    setViewBar({ label, onBack: requestClose });
    return () => setViewBar(null);
  }, [visible, label, requestClose]);

  return (
    <Dialog.Root
      open={visible}
      onOpenChange={(next) => !next && requestClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm view-overlay" />
        <Dialog.Content
          ref={contentRef}
          {...(title ? { "aria-describedby": undefined } : {})}
          // A click anywhere on the dimmed area closes the view, which is everything in here that is not
          // the window itself: the sides, the top, and the empty space under a window shorter than the screen
          // (that part is covered by layout wrappers, so comparing the target with one element isn't enough).
          // Clicks from portaled popovers are not inside this element in the DOM, so they never close it.
          onClick={(event) => {
            const target = event.target;
            if (!(target instanceof Element) || !target.isConnected || !event.currentTarget.contains(target)) return;
            if (!target.closest(".glitch-border")) requestClose();
          }}
          className="fixed inset-0 z-[60] flex flex-col outline-none view-content"
        >
          {title && <Dialog.Title className="sr-only">{title}</Dialog.Title>}

          {/* Centred on the screen; equal space top and bottom (the top one clears the navbar's back bar). */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-20">
            <div
              className={`flex min-h-0 w-full flex-1 flex-col justify-center ${widthClass}`}
            >
              {typeof children === "function"
                ? children(requestClose)
                : children}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { setViewBar } from "@/components/ui/viewBar";
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
  const timer = useRef<number | undefined>(undefined);
  const onCloseRef = useRef(onClose);
  const visible = open && !closing;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open) setClosing(false);
  }, [open]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const requestClose = useCallback(() => {
    if (timer.current !== undefined) return;
    setClosing(true);
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      onCloseRef.current();
    }, EXIT_MS);
  }, []);

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
          {...(title ? { "aria-describedby": undefined } : {})}
          onClick={(event) => {
            if (event.target === event.currentTarget) requestClose();
          }}
          className="fixed inset-0 z-[60] flex flex-col outline-none view-content"
        >
          {title && <Dialog.Title className="sr-only">{title}</Dialog.Title>}

          <div
            onClick={(event) => {
              if (event.target === event.currentTarget) requestClose();
            }}
            className="flex min-h-0 flex-1 flex-col items-center px-4 pb-6 pt-20"
          >
            <div
              className={`flex min-h-0 w-full flex-1 flex-col ${widthClass}`}
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

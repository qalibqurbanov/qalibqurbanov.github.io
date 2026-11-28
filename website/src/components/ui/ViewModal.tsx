import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";


/** Slightly longer than the CSS exit animation (180ms) so the view is still
 * mounted while it fades out. */
const EXIT_MS = 200;

interface ViewModalProps {
  /** Screen-reader title. Omit when the children render their own Dialog.Title. */
  title?: string;
  /** Tailwind max-width class for the window. */
  widthClass: string;
  onClose: () => void;
  open?: boolean;
  /** Receives `close`, which plays the exit animation before calling `onClose`. */
  children: ReactNode | ((close: () => void) => ReactNode);
}

/** Modal shell shared by the project, résumé, article and contact views: everything around the dialog is
 * dimmed and blurred, and the dialog rises in and sinks out (see the dialog rules in theme.css). It has no bar
 * of its own: the panel inside brings its close button, and Esc or a click outside closes it too. */
export function ViewModal({
  title,
  widthClass,
  onClose,
  open = true,
  children,
}: ViewModalProps) {
  const [closing, setClosing] = useState(false);
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

  const requestClose = useCallback(() => setClosing(true), []);

  // A click closes the view only when it both starts and ends on the empty space around the panel,
  // so dragging a text selection out of the panel does not close it.
  const pressedOutside = useRef(false);
  const isBackdrop = (target: EventTarget) =>
    target instanceof HTMLElement && target.dataset.viewBackdrop !== undefined;

  return (
    <Dialog.Root
      open={visible}
      onOpenChange={(next) => !next && requestClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] view-overlay" />
        <Dialog.Content
          {...(title ? { "aria-describedby": undefined } : {})}
          data-view-backdrop=""
          onPointerDown={(event) => {
            pressedOutside.current = isBackdrop(event.target);
          }}
          onClick={(event) => {
            if (pressedOutside.current && isBackdrop(event.target)) requestClose();
            pressedOutside.current = false;
          }}
          className="fixed inset-0 z-[60] flex flex-col outline-none view-content"
        >
          {title && <Dialog.Title className="sr-only">{title}</Dialog.Title>}

          <div
            data-view-backdrop=""
            className="flex min-h-0 flex-1 flex-col items-center p-4 sm:p-8"
          >
            <div
              data-view-backdrop=""
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

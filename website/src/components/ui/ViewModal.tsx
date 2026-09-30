import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { useContent } from "@/i18n/context";

interface ViewModalProps {
  /** Screen-reader title. Omit when the children render their own Dialog.Title. */
  title?: string;
  backLabel?: string;
  /** Tailwind max-width class for the window. */
  widthClass: string;
  onClose: () => void;
  open?: boolean;
  children: ReactNode;
}

/** Modal shell shared by the project, resume and contact views: the same
 * blurred, dimmed overlay everywhere, with a navbar-styled bar on top that
 * holds a single "back" button, so the page the visitor left stays visible. */
export function ViewModal({
  title,
  backLabel,
  widthClass,
  onClose,
  open = true,
  children,
}: ViewModalProps) {
  const { ui } = useContent();

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm command-dialog-overlay" />
        <Dialog.Content
          {...(title ? { "aria-describedby": undefined } : {})}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[60] flex flex-col outline-none command-dialog-content"
        >
          {title && <Dialog.Title className="sr-only">{title}</Dialog.Title>}

          <header className="shrink-0 border-b border-border bg-bg/75 shadow-lg shadow-black/10 backdrop-blur-md">
            <div className="h-[2px] w-full" />
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex cursor-pointer items-center gap-2 font-mono text-sm text-muted transition-colors hover:text-accent"
              >
                <ArrowLeft size={16} />
                {backLabel ?? ui.resumeView.back}
              </button>
            </nav>
          </header>

          <div
            onClick={(event) => {
              if (event.target === event.currentTarget) onClose();
            }}
            className="flex min-h-0 flex-1 flex-col items-center px-4 py-6"
          >
            <div className={`flex min-h-0 w-full flex-1 flex-col ${widthClass}`}>
              {children}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

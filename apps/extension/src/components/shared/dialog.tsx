import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import { IconX } from "@tabler/icons-react";
import type { FC, ReactElement, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";

type Props = {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
};

export const Dialog: FC<Props> = ({ children, onClose, open, title }): ReactElement | null => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  if (!open) return null;

  const id = "dialog-title";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
    >
      <div
        className="absolute inset-0 bg-background/50 backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:bg-accent/8 before:content-['']"
        onClick={onClose}
        aria-hidden="true"
      />

      <style>{`
        @keyframes dialog-enter {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl outline-none"
        style={{ animation: "dialog-enter 0.2s ease-out" }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 id={id} className="text-[11px] font-bold leading-none uppercase tracking-widest text-foreground">
            {title}
          </h2>
          <Button
            variant="unstyled"
            size="none"
            onClick={onClose}
            aria-label={t("close")}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
          >
            <IconX className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

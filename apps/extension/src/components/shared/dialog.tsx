import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import { IconX } from "@/lib/tabler-icons";
import type { FC, ReactElement, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef } from "react";

export const dialogPrimaryClassName =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50";

export const dialogSecondaryClassName =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card-2 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground";

export const dialogDangerClassName =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15";

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
  subtitle?: string;
  title: string;
};

export const Dialog: FC<Props> = ({ children, footer, onClose, open, subtitle, title }): ReactElement | null => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
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
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 id={titleId} className="text-base font-semibold leading-5 text-foreground">
              {title}
            </h2>
            {subtitle ? <p className="text-sm leading-5 text-muted-foreground">{subtitle}</p> : null}
          </div>
          <Button
            variant="unstyled"
            size="none"
            onClick={onClose}
            aria-label={t("close")}
            className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
          >
            <IconX className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer ? (
          <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};

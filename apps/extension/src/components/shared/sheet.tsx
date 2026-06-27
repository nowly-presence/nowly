import { Button } from "@/components/ui/button";
import { IconX } from "@tabler/icons-react";
import type { FC, ReactElement, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";

type Props = {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  position?: "right" | "bottom";
  subtitle?: string;
  title: string;
};

export const Sheet: FC<Props> = ({ children, onClose, open, position = "right", subtitle, title }): ReactElement | null => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isBottom = position === "bottom";

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
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  if (!open) return null;

  const id = "sheet-title";

  return (
    <div
      className={`fixed inset-0 z-50 flex ${isBottom ? "items-end" : "justify-end"}`}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <style>{`
        @keyframes sheet-enter-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes sheet-enter-bottom {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative z-10 flex flex-col bg-card shadow-2xl outline-none ${
          isBottom
            ? "w-full rounded-t-2xl"
            : "w-full max-w-sm"
        }`}
        style={{
          animation: isBottom
            ? "sheet-enter-bottom 0.3s ease-out"
            : "sheet-enter-right 0.25s ease-out",
          maxHeight: isBottom ? "85vh" : undefined,
        }}
      >
        <div className={`flex items-start justify-between gap-2 border-border px-4 py-3 ${
          isBottom ? "border-b" : "border-b"
        }`}>
          <div className="flex flex-col gap-0.5">
            <h2 id={id} className="text-[11px] font-bold uppercase tracking-widest text-foreground">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <Button
            variant="unstyled"
            size="none"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};
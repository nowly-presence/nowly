import { useEffect, useRef, type ReactNode } from "react";

export const Modal = ({ titleId, descriptionId, children, onEscape }: { titleId: string; descriptionId: string; children: ReactNode; onEscape?: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = ref.current;
    panel?.focus();
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape?.();
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), [tabindex="0"]')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", keyDown);
    return () => { document.removeEventListener("keydown", keyDown); previous?.focus(); };
  }, [onEscape]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/25 px-3 py-4 backdrop-blur-sm">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1} className="scroll-thin max-h-full w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface outline-none">
        {children}
      </div>
    </div>
  );
};

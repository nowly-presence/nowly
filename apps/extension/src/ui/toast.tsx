import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { RiCheckLine, RiErrorWarningLine, RiInformationLine } from "@remixicon/react";
import { cn } from "@/ui/cn";
import { layoutToastStack } from "@/ui/toast-stack";

type ToastTone = "success" | "error" | "info";
type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
  action?: {
    label: string;
    onClick: () => void;
  };
  leaving?: boolean;
};
type ToastTimer = {
  remaining: number;
  startedAt: number;
  handle?: number;
};

type ToastValue = {
  toast: (message: string, tone?: ToastTone, action?: Toast["action"]) => void;
};

const MAX_TOASTS = 5;
const TOAST_MS = 3200;
const ACTION_TOAST_MS = 5200;
const RESUMED_TOAST_MIN_MS = 1000;
const EXIT_MS = 250;
const EXIT_DROP = 8;

const ToastContext = createContext<ToastValue | null>(null);

const icons = {
  success: <RiCheckLine className="size-4 shrink-0 text-success" />,
  error: <RiErrorWarningLine className="size-4 shrink-0 text-danger" />,
  info: <RiInformationLine className="size-4 shrink-0 text-tertiary-accent" />
};

export const ToastProvider = ({ children }: {
  children: ReactNode;
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const [expanded, setExpanded] = useState(false);
  const [sheetBottom, setSheetBottom] = useState<number | null>(null);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ToastTimer>());
  const paused = useRef(false);
  const observer = useRef<ResizeObserver | null>(null);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);

    if (timer?.handle !== undefined) window.clearTimeout(timer.handle);

    timers.current.delete(id);
    setToasts((current) => current.map((item) => (item.id === id ? { ...item, leaving: true } : item)));
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), EXIT_MS);
  }, []);

  const schedule = useCallback((id: number) => {
    const timer = timers.current.get(id);

    if (!timer || paused.current || timer.handle !== undefined) return;

    timer.startedAt = Date.now();
    timer.handle = window.setTimeout(() => dismiss(id), timer.remaining);
  }, [dismiss]);

  const toast = useCallback<ToastValue["toast"]>((message, tone = "success", action) => {
    const id = nextId.current++;
    timers.current.set(id, {
      remaining: action ? ACTION_TOAST_MS : TOAST_MS,
      startedAt: 0
    });
    setToasts((current) =>
      [
        ...current,
        { id, message, tone, action }
      ].slice(-MAX_TOASTS)
    );
    schedule(id);
  }, [schedule]);

  const pause = useCallback(() => {
    if (paused.current) return;

    paused.current = true;
    setExpanded(true);
    const now = Date.now();

    for (const timer of timers.current.values()) {
      if (timer.handle === undefined) continue;

      window.clearTimeout(timer.handle);
      timer.handle = undefined;
      timer.remaining = Math.max(RESUMED_TOAST_MIN_MS, timer.remaining - (now - timer.startedAt));
    }
  }, []);

  const resume = useCallback(() => {
    if (!paused.current) return;

    paused.current = false;
    setExpanded(false);

    for (const id of timers.current.keys()) schedule(id);
  }, [schedule]);

  const leaveFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) resume();
  };

  const measure = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    observer.current ??= new ResizeObserver((entries) =>
      setHeights((current) => {
        let next = current;

        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          const id = Number(element.dataset.toastId);

          if (next[id] !== element.offsetHeight) next = {
            ...next,
            [id]: element.offsetHeight
          };
        }

        return next;
      })
    );
    observer.current.observe(node);
    return () => observer.current?.unobserve(node);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  useEffect(() => {
    const ids = new Set(toasts.map((item) => item.id));

    for (const [id, timer] of timers.current) {
      if (ids.has(id)) continue;

      if (timer.handle !== undefined) window.clearTimeout(timer.handle);

      timers.current.delete(id);
    }

    setHeights((current) =>
      Object.keys(current).every((id) => ids.has(Number(id))) ? current : Object.fromEntries(Object.entries(current).filter(([id]) => ids.has(Number(id))))
    );

    if (toasts.length === 0) {
      paused.current = false;
      setExpanded(false);
    }
  }, [toasts]);

  useLayoutEffect(() => {
    if (toasts.length === 0) {
      setSheetBottom(null);
      return;
    }

    const updatePosition = () => {
      const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');

      if (!dialog) {
        setSheetBottom(null);
        return;
      }

      const top = dialog.getBoundingClientRect().top;
      setSheetBottom(Math.max(8, window.innerHeight - top + 8));
    };

    updatePosition();
    const observer = new MutationObserver(updatePosition);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    window.addEventListener("resize", updatePosition);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
    };
  }, [toasts.length]);

  const value = useMemo(() => ({ toast }), [toast]);
  const ordered = [...toasts].reverse();
  const stack = layoutToastStack(
    ordered.map((item) => heights[item.id] ?? 0),
    expanded
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" style={{ bottom: sheetBottom ?? 84 }} className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4">
        <div
          style={{ height: stack.height }}
          onMouseEnter={pause}
          onMouseLeave={resume}
          onFocus={pause}
          onBlur={leaveFocus}
          className={cn(
            "relative w-full max-w-sm transition-[height] duration-300 ease-out-soft motion-reduce:transition-none",
            expanded ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          {ordered.map((item, depth) => {
            const layout = stack.items[depth];
            const covered = depth > 0 && !expanded;
            return (
              <div
                key={item.id}
                aria-hidden={layout.hidden || undefined}
                style={{
                  transform: `translateY(${item.leaving ? EXIT_DROP - layout.offset : -layout.offset}px) scale(${layout.scale})`,
                  height: layout.clampedHeight ?? undefined,
                  opacity: layout.hidden || item.leaving ? 0 : 1,
                  zIndex: ordered.length - depth
                }}
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 flex origin-top items-start justify-center transition-[transform,opacity] duration-300 ease-out-soft motion-reduce:transition-none",
                  layout.clampedHeight !== null && "overflow-hidden"
                )}
              >
                <div
                  ref={measure}
                  data-toast-id={item.id}
                  className={cn(
                    "flex w-fit max-w-full animate-enter-up items-start gap-2.5 rounded-md border border-tertiary-edge bg-tertiary py-2 pr-2 pl-3 text-on-tertiary [&>*]:transition-opacity [&>*]:duration-200",
                    layout.hidden ? "pointer-events-none" : "pointer-events-auto",
                    covered && "[&>*]:opacity-0"
                  )}
                >
                  {icons[item.tone]}
                  <span className="min-w-0 whitespace-normal break-words text-label-lg font-medium">{item.message}</span>
                  {item.action && (
                    <button
                      type="button"
                      onClick={item.action.onClick}
                      tabIndex={covered ? -1 : undefined}
                      className="ml-1 shrink-0 rounded-sm px-2 py-1 text-label-md font-medium text-tertiary-accent hover:bg-tertiary-line"
                    >
                      {item.action.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastValue => {
  const value = useContext(ToastContext);

  if (!value) throw new Error("useToast must be used inside <ToastProvider>");

  return value;
};
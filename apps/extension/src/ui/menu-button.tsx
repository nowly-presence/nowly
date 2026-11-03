import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/ui/cn";

export type MenuItem = {
  value: string;
  label: string;
  hint?: string;
};

type MenuButtonProps = {
  items: MenuItem[];
  onSelect: (value: string) => void;
  label: string;
  heading?: string;
  children: ReactNode;
  className?: string;
};

const GAP = 6;
const MENU_WIDTH = 224;
const MENU_MAX_HEIGHT = 260;

export const MenuButton = ({ items, onSelect, label, heading, children, className }: MenuButtonProps) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();

    if (!rect) return;

    const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
    const below = window.innerHeight - rect.bottom - GAP - 8;
    const above = rect.top - GAP - 8;
    setPosition(
      below < 160 && above > below
        ? { left, bottom: window.innerHeight - rect.top + GAP, maxHeight: Math.min(MENU_MAX_HEIGHT, above) }
        : { left, top: rect.bottom + GAP, maxHeight: Math.min(MENU_MAX_HEIGHT, below) }
    );
  }, []);

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  const choose = (index: number) => {
    const item = items[index];
    setOpen(false);
    if (item) onSelect(item.value);
  };

  useLayoutEffect(() => {
    if (open) listRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !listRef.current?.contains(target) && !triggerRef.current?.contains(target)) close(false);
    };
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && listRef.current?.contains(event.target)) return;

      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) close(false);
      else place();
    };
    window.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", place);
    };
  }, [open, close, place]);

  const onListKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") setActive((index) => Math.min(items.length - 1, index + 1));
    else if (event.key === "ArrowUp") setActive((index) => Math.max(0, index - 1));
    else if (event.key === "Enter" || event.key === " ") choose(active);
    else if (event.key === "Escape") close();
    else if (event.key === "Tab") return close(false);
    else return;
    event.preventDefault();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={items.length === 0}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (open) return close();

          setActive(0);
          place();
          setOpen(true);
        }}
        className={className}
      >
        {children}
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={listRef}
            id={listId}
            role="menu"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={`${listId}-${active}`}
            onKeyDown={onListKey}
            style={{
              left: position.left,
              width: MENU_WIDTH,
              top: position.top,
              bottom: position.bottom,
              maxHeight: position.maxHeight
            }}
            className="scroll-thin fixed z-[60] flex animate-fade flex-col gap-px overflow-y-auto rounded-md border border-line bg-surface p-1 shadow-[0_10px_30px_-18px_rgb(7_8_12/0.45)] outline-none"
          >
            {heading && <span className="px-2.5 pt-1.5 pb-1 text-label-sm text-muted">{heading}</span>}
            {items.map((item, index) => (
              <div
                key={item.value}
                id={`${listId}-${index}`}
                role="menuitem"
                onPointerMove={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
                className={cn("flex min-h-8 cursor-pointer flex-col rounded-[8px] px-2.5 py-1.5 select-none", index === active && "bg-hover")}
              >
                <span className="truncate text-label-md text-ink">{item.label}</span>
                {item.hint && <span className="truncate text-label-sm text-muted">{item.hint}</span>}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};
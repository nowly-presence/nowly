import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { IconCheck, IconChevronDown } from "@/lib/tabler-icons";
import type { ReactNode } from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type CustomSelectOption<T extends string> = {
  icon?: ReactNode;
  label: string;
  value: T;
};

type MenuPosition = {
  left: number;
  top: number;
  width: number;
};

type Props<T extends string> = {
  align?: "start" | "end";
  "aria-label"?: string;
  className?: string;
  onChange: (value: T) => void;
  options: Array<CustomSelectOption<T>>;
  value: T;
};

export const CustomSelect = <T extends string>({
  align = "start",
  "aria-label": ariaLabel,
  className,
  onChange,
  options,
  value,
}: Props<T>): ReactNode => {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  const updatePosition = (): void => {
    const trigger = rootRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 140);
    const left = align === "end" ? Math.max(8, rect.right - width) : rect.left;
    const estimatedHeight = options.length * 36 + 10;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;
    const top = openUp ? Math.max(8, rect.top - estimatedHeight - 4) : rect.bottom + 4;

    setPosition({ left, top, width });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [align, open, options.length]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };

    const onReposition = (): void => updatePosition();

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [align, open, options.length]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        aria-controls={open ? listId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={cn(
          "relative flex w-full items-center gap-2 rounded-xl border border-border bg-card-2 pr-8 pl-3 text-left text-sm text-foreground outline-none transition-colors hover:bg-card-hover focus-visible:border-border-light",
          className,
        )}
        onClick={() => setOpen((current) => !current)}
        size="none"
        type="button"
        variant="unstyled"
      >
        {selected?.icon ? <span className="inline-flex size-4 shrink-0 items-center justify-center">{selected.icon}</span> : null}
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <IconChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" />
      </Button>

      {open && position
        ? createPortal(
            <div
              className="fixed z-50 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
              id={listId}
              ref={menuRef}
              role="listbox"
              style={{ left: position.left, top: position.top, width: position.width }}
            >
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    aria-selected={isSelected}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-card-2"
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    {option.icon ? <span className="inline-flex size-4 shrink-0 items-center justify-center">{option.icon}</span> : null}
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {isSelected ? <IconCheck className="size-4 shrink-0 text-accent" /> : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};

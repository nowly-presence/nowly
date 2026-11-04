import type { ReactNode } from "react";
import { cn } from "@/ui/cn";

export type OptionCardsItem<T extends string> = {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
  preview?: ReactNode;
  ariaLabel?: string;
};

type OptionCardsProps<T extends string> = {
  options: ReadonlyArray<OptionCardsItem<T>>;
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  size?: "default" | "sm" | "xs";
  columns?: number;
  className?: string;
};

export const OptionCards = <T extends string>({ options, value, onValueChange, label, size = "default", columns, className }: OptionCardsProps<T>) => {
  const compact = size === "xs";
  const small = size === "sm" || compact;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
      className={cn("grid", small ? "gap-2" : "gap-2.5", !columns && "grid-cols-2", className)}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.ariaLabel ?? option.label}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "flex w-full transition-colors duration-150",
              small
                ? cn("flex-col items-center justify-center gap-1 rounded-md px-2 text-center", compact ? "min-h-10 py-2" : "min-h-16 py-3")
                : "min-h-24 flex-col items-start gap-2.5 rounded-md p-3 text-left",
              active ? "bg-primary text-on-primary" : "bg-hover text-ink hover:bg-press"
            )}
          >
            {small ? (
              <>
                <span className="text-label-md font-medium">{option.label}</span>
                {option.preview && (
                  <span className="font-medium" aria-hidden>
                    {option.preview}
                  </span>
                )}
              </>
            ) : (
              <>
                {option.icon && (
                  <span aria-hidden className="[&_svg]:size-4">
                    {option.icon}
                  </span>
                )}
                <span className="flex flex-col gap-0.5">
                  <span className="text-label-lg font-medium">{option.label}</span>
                  {option.description && (
                    <span className={cn("text-label-md font-normal", active ? "text-on-primary/75" : "text-muted")}>{option.description}</span>
                  )}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
};
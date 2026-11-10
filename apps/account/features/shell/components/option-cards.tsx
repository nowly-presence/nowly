"use client";

import { cn } from "@nowly/ui/utils";
import type { ComponentType } from "react";

export type OptionCardsItem<T extends string> = {
  value: T;
  label: string;
  description: string;
  icon: ComponentType<{
    className?: string;
  }>;
};

export const OptionCards = <T extends string>({ options, value, onValueChange, label, className }: {
  options: ReadonlyArray<OptionCardsItem<T>>;
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  className?: string;
}) => (
  <div role="radiogroup" aria-label={label} className={cn("grid gap-2.5 sm:grid-cols-3", className)}>
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onValueChange(option.value)}
          className={cn(
            "flex min-h-24 flex-col items-start gap-2 rounded-[10px] p-3 text-left outline-none ring-1 transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            active ? "bg-primary/10 ring-2 ring-primary" : "bg-foreground/4 ring-foreground/10 hover:bg-foreground/6"
          )}
        >
          <option.icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{option.label}</span>
            <span className="text-xs text-muted-foreground">{option.description}</span>
          </span>
        </button>
      );
    })}
  </div>
);
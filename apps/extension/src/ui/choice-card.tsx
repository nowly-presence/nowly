import type { ReactNode } from "react";
import { cn } from "@/ui/cn";

export const ChoiceCard = ({ selected, onSelect, icon, title, description }: {
  selected: boolean;
  onSelect: () => void;
  icon?: ReactNode;
  title: string;
  description: string;
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={cn(
      "flex w-full items-start gap-3 rounded-lg border bg-surface p-4 text-left transition-colors",
      selected ? "border-primary" : "border-line hover:border-line-strong"
    )}
  >
    {icon && (
      <span
        className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md", selected ? "bg-primary-soft text-primary" : "bg-hover text-muted")}
      >
        {icon}
      </span>
    )}
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-label-lg font-medium">{title}</span>
      <span className="text-label-md text-muted">{description}</span>
    </span>
    <span className={cn("mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border", selected ? "border-primary" : "border-line-strong")}>
      {selected && <span className="size-2 rounded-full bg-primary" />}
    </span>
  </button>
);
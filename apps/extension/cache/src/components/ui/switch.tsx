import { cn } from "@/lib/cn";
import type { FC } from "react";

type Props = {
  ariaLabel?: string;
  checked: boolean;
  id?: string;
  onChange: (checked: boolean) => void;
};

export const Switch: FC<Props> = ({ ariaLabel, checked, id, onChange }): React.ReactElement => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={() => onChange(!checked)}
    className={cn(
      "group relative h-4.5 w-9 shrink-0 rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      checked ? "bg-accent" : "bg-card-2 border border-border",
    )}
  >
    <span
      className={cn(
        "absolute top-0.5 h-3.25 w-3.25 rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-all duration-300",
        checked ? "left-5 bg-white" : "left-0.5 bg-dim-foreground/30",
      )}
    />
  </button>
);
import { cn } from "@/lib/cn";
import { IconCheck } from "@tabler/icons-react";
import type { FC } from "react";

type Props = {
  ariaLabel?: string;
  checked: boolean;
  id?: string;
  onChange: (checked: boolean) => void;
};

export const Checkbox: FC<Props> = ({ ariaLabel, checked, id, onChange }): React.ReactElement => (
  <button
    type="button"
    role="checkbox"
    id={id}
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={() => onChange(!checked)}
    className={cn(
      "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      checked ? "bg-accent" : "border border-border bg-card-2",
    )}
  >
    {checked ? <IconCheck className="h-3 w-3 stroke-3 text-white" /> : null}
  </button>
);
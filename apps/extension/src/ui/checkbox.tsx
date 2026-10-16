import { RiCheckLine } from "@remixicon/react";
import type { ReactNode } from "react";

export const Checkbox = ({ checked, onChange, disabled, children }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
}) => (
  <label className="flex cursor-pointer items-start gap-3 text-label-md text-ink has-disabled:cursor-default has-disabled:opacity-60">
    <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border border-line-strong bg-surface text-transparent transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
      <RiCheckLine className="size-3.5" aria-hidden />
    </span>
    <span>{children}</span>
  </label>
);
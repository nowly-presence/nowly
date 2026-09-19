import { cn } from "@/lib/cn";
import type { SelectHTMLAttributes } from "react";
import { forwardRef } from "react";

const BASE =
  "h-9 w-full cursor-pointer rounded-md border border-border bg-card-2 px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Drop the default styling so a fully custom `className` controls the look. */
  unstyled?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, unstyled, ...props }, ref) => (
    <select ref={ref} className={cn(unstyled ? undefined : BASE, className)} {...props}>
      {children}
    </select>
  ),
);
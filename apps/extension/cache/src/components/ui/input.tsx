import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";

const BASE =
  "h-9 w-full rounded-md border border-border bg-card-2 px-3 text-sm text-foreground placeholder:text-dim-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Drop the default styling so a fully custom `className` controls the look. */
  unstyled?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, unstyled, ...props }, ref) => (
    <input ref={ref} type={type ?? "text"} className={cn(unstyled ? undefined : BASE, className)} {...props} />
  ),
);
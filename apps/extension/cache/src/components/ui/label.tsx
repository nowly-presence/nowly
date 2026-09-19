import { cn } from "@/lib/cn";
import type { LabelHTMLAttributes } from "react";
import { forwardRef } from "react";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  /** Drop the default styling so a fully custom `className` controls the look. */
  unstyled?: boolean;
};

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, unstyled, ...props }, ref) => (
    <label ref={ref} className={cn(unstyled ? undefined : "text-sm font-medium text-foreground", className)} {...props}>
      {children}
    </label>
  ),
);
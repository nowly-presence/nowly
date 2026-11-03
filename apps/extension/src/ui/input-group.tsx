import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/ui/cn";
import { fieldAria, useFieldIds } from "@/ui/field";

export const InputGroup = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div
    className={cn(
      "flex h-9 w-full items-stretch overflow-hidden rounded-md border border-line bg-surface transition-colors duration-150 hover:border-line-strong focus-within:border-primary",
      className
    )}
  >
    {children}
  </div>
);

export const InputGroupInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  const field = useFieldIds();
  return (
    <input
      ref={ref}
      className={cn("h-full min-w-0 flex-1 bg-transparent px-3 text-body-sm text-ink outline-none placeholder:text-muted/70 disabled:opacity-50", className)}
      {...props}
      {...fieldAria(field, props)}
    />
  );
});

InputGroupInput.displayName = "InputGroupInput";

export const InputGroupAddon = ({ className, children }: { className?: string; children: ReactNode }) => (
  <span className={cn("flex shrink-0 items-center px-3 text-label-sm text-muted", className)}>{children}</span>
);

export const InputGroupCounter = ({ length, max }: { length: number; max: number }) => (
  <InputGroupAddon className={cn("pl-0 tabular-nums", length > max && "text-danger")}>
    {length}/{max}
  </InputGroupAddon>
);
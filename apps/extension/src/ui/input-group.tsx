import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
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

export const InputGroupAddon = ({ className, children, text = false }: { className?: string; children: ReactNode; text?: boolean }) => (
  <span className={cn("flex shrink-0 items-center px-3 text-muted", text ? "text-body-sm" : "text-label-sm", className)}>{children}</span>
);

export const InputGroupCounter = ({ length, max }: { length: number; max: number }) => (
  <InputGroupAddon className={cn("pl-0 tabular-nums", length > max && "text-danger")}>
    {length}/{max}
  </InputGroupAddon>
);

export const InputGroupTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => {
  const field = useFieldIds();
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full resize-none bg-transparent px-3 py-2.5 text-body-sm leading-[21px] text-ink outline-none placeholder:text-muted/70 disabled:opacity-50",
        className
      )}
      {...props}
      {...fieldAria(field, props)}
    />
  );
});

InputGroupTextarea.displayName = "InputGroupTextarea";

export const InputGroupFooter = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("flex items-center justify-end px-3 pb-2 text-label-sm text-muted tabular-nums", className)}>{children}</div>
);

export const InputGroupBlock = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div
    className={cn(
      "flex w-full flex-col overflow-hidden rounded-md border border-line bg-surface transition-colors duration-150 hover:border-line-strong focus-within:border-primary",
      className
    )}
  >
    {children}
  </div>
);

export const InputGroupButton = ({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className="flex shrink-0 items-center justify-center border-l border-line px-2.5 text-muted transition-colors hover:bg-hover hover:text-ink"
  >
    {children}
  </button>
);
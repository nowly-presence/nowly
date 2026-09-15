import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  [
    "group/alert relative w-full overflow-hidden rounded-2xl border",
    "px-4 py-4",
    "shadow-sm transition-colors",
    "has-data-[slot=alert-action]:pr-16",
    "has-[>svg]:grid has-[>svg]:grid-cols-[auto_1fr]",
    "has-[>svg]:gap-x-3 has-[>svg]:gap-y-1",
    "*:[svg]:row-span-2",
    "*:[svg]:mt-0.5",
    "*:[svg]:size-5",
    "*:[svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: [
          "border-border/80",
          "bg-card",
          "text-foreground",
          "*:[svg]:text-accent",
        ],
        destructive: [
          "border-destructive/20",
          "bg-destructive/5",
          "text-foreground",
          "*:[svg]:text-destructive",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-semibold tracking-tight text-foreground",
        "group-has-[>svg]/alert:col-start-2",
        "[&_a]:underline [&_a]:underline-offset-4",
        "[&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm leading-6 text-muted-foreground",
        "group-has-[>svg]/alert:col-start-2",
        "[&_a]:underline [&_a]:underline-offset-4",
        "[&_a]:hover:text-foreground",
        "[&_p:not(:last-child)]:mb-3",
        className
      )}
      {...props}
    />
  );
}

function AlertAction({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        "absolute right-4 top-4",
        className
      )}
      {...props}
    />
  );
}

export {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle
};

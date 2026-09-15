import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1",
    "overflow-hidden rounded-full border px-2.5 py-1",
    "text-xs font-medium leading-none whitespace-nowrap",
    "transition-colors outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring/30",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
    "[&>svg]:pointer-events-none [&>svg]:size-3",
  ],
  {
    variants: {
      variant: {
        default: [
          "border-transparent bg-foreground text-background",
          "[a]:hover:bg-foreground/90",
        ],

        accent: [
          "border-transparent bg-accent text-background",
          "[a]:hover:bg-cyan-300",
        ],

        secondary: [
          "border-border bg-card-2 text-foreground",
          "[a]:hover:bg-card-hover",
        ],

        destructive: [
          "border-destructive/20 bg-destructive/10 text-destructive",
          "focus-visible:ring-destructive/20",
          "[a]:hover:bg-destructive/20",
        ],

        outline: [
          "border-border bg-transparent text-muted-foreground",
          "[a]:hover:bg-card-2 [a]:hover:text-foreground",
        ],

        ghost: [
          "border-transparent bg-transparent text-muted-foreground",
          "hover:bg-card-2 hover:text-foreground",
        ],

        link: [
          "border-transparent bg-transparent p-0 text-foreground underline-offset-4",
          "hover:underline",
        ],
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

function Badge({
  className,
  variant = "secondary",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

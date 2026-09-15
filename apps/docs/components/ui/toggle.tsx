"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Toggle as TogglePrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  [
    "group/toggle inline-flex items-center justify-center gap-2",
    "shrink-0 whitespace-nowrap rounded-xl",
    "text-sm font-medium outline-none transition-all duration-200",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:ring-2 focus-visible:ring-ring/30",
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    "data-[state=on]:text-foreground",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-transparent text-muted-foreground",
          "hover:bg-card-2 hover:text-foreground",
          "data-[state=on]:bg-card-2",
        ],

        outline: [
          "border border-border bg-transparent text-muted-foreground",
          "hover:border-border-light hover:bg-card-2 hover:text-foreground",
          "data-[state=on]:border-border-light data-[state=on]:bg-card-2",
        ],

        accent: [
          "bg-transparent text-muted-foreground",
          "hover:bg-accent/10 hover:text-accent",
          "data-[state=on]:bg-accent/10 data-[state=on]:text-accent",
        ],
      },

      size: {
        sm: "h-8 min-w-8 rounded-lg px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",

        default: "h-10 min-w-10 px-3",

        lg: "h-11 min-w-11 px-4",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      data-variant={variant}
      data-size={size}
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };

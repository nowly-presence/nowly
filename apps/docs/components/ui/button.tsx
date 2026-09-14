import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg font-semibold outline-none transition-all duration-200 cursor-pointer",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
    "focus-visible:ring-2 focus-visible:ring-ring/30",
    "active:scale-[0.98]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-foreground text-background",
          "shadow-[0_0_20px_rgba(255,255,255,0.1)]",
          "hover:bg-[#e4e4e7]",
          "hover:shadow-[0_4px_25px_rgba(255,255,255,0.2)]",
        ],

        primary: [
          "bg-foreground text-background",
          "shadow-[0_0_20px_rgba(255,255,255,0.1)]",
          "hover:bg-[#e4e4e7]",
          "hover:shadow-[0_4px_25px_rgba(255,255,255,0.2)]",
        ],

        accent: [
          "bg-accent text-background",
          "shadow-[0_0_20px_rgba(34,211,238,0.14)]",
          "hover:bg-cyan-300",
          "hover:shadow-[0_4px_25px_rgba(34,211,238,0.22)]",
        ],

        secondary: [
          "border border-border bg-card-2 text-foreground",
          "hover:border-muted-foreground",
          "hover:bg-card-hover",
        ],

        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90",
        ],

        outline: [
          "border border-border bg-transparent text-foreground",
          "hover:border-border-light",
          "hover:bg-card-2",
        ],

        ghost: [
          "bg-transparent text-muted-foreground",
          "hover:bg-card-2",
          "hover:text-foreground",
        ],

        link: [
          "h-auto rounded-none p-0 text-foreground underline-offset-4",
          "hover:underline",
          "shadow-none active:scale-100",
        ],
      },

      size: {
        xs: "h-7 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",

        sm: "px-4 py-2 text-sm",

        default: "px-5 py-2.5 text-sm",

        md: "px-5 py-2.5 text-sm",

        lg: "px-10 py-4 text-lg",

        cta: "px-12 py-5 text-lg md:px-14 md:py-5 md:text-xl",

        icon: "size-10 p-0",

        "icon-xs": "size-7 p-0 [&_svg:not([class*='size-'])]:size-3",

        "icon-sm": "size-8 p-0",

        "icon-lg": "size-11 p-0",
      },
    },

    defaultVariants: {
      variant: "secondary",
      size: "lg",
    },
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant = "secondary",
  size = "md",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };

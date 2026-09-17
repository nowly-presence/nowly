"use client";

import { buttonVariants, type ButtonVariantProps } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> &
  ButtonVariantProps & {
    asChild?: boolean
  };

function Button({
  className,
  variant = "secondary",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button };

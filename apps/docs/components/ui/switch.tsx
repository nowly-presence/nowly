"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer relative inline-flex shrink-0 cursor-pointer items-center",
        "rounded-full border border-transparent",
        "outline-none transition-all duration-200",

        "focus-visible:ring-2 focus-visible:ring-ring/30",

        "data-checked:bg-accent",
        "data-unchecked:bg-card-hover",

        "disabled:cursor-not-allowed",
        "disabled:opacity-50",

        "data-[size=default]:h-6",
        "data-[size=default]:w-11",

        "data-[size=sm]:h-5",
        "data-[size=sm]:w-9",

        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full",
          "bg-background shadow-sm",
          "transition-transform duration-200",

          "data-unchecked:translate-x-0",

          "group-data-[size=default]/switch:size-5",
          "group-data-[size=sm]/switch:size-4",

          "group-data-[size=default]/switch:data-checked:translate-x-5",
          "group-data-[size=sm]/switch:data-checked:translate-x-4"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };

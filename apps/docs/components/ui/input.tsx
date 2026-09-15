"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Input({
  className,
  type,
  _size = "default",
  ...props
}: React.ComponentProps<"input"> & {
  _size?: "sm" | "default" | "lg";
}) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={_size}
      className={cn(
        "flex w-full min-w-0",

        "border border-border",
        "bg-card",

        "text-foreground",
        "placeholder:text-muted-foreground",

        "transition-all duration-200",
        "outline-none",

        "hover:border-border-light",

        "focus:border-accent",
        "focus:ring-2 focus:ring-accent/20",

        "disabled:pointer-events-none",
        "disabled:cursor-not-allowed",
        "disabled:opacity-50",
        "disabled:bg-card-2",

        "aria-invalid:border-destructive",
        "aria-invalid:ring-2",
        "aria-invalid:ring-destructive/20",

        "file:border-0",
        "file:bg-transparent",
        "file:text-sm",
        "file:font-medium",

        "data-[size=sm]:h-8",
        "data-[size=sm]:rounded-lg",
        "data-[size=sm]:px-3",
        "data-[size=sm]:text-xs",

        "data-[size=default]:h-10",
        "data-[size=default]:rounded-xl",
        "data-[size=default]:px-4",
        "data-[size=default]:text-sm",

        "data-[size=lg]:h-12",
        "data-[size=lg]:rounded-xl",
        "data-[size=lg]:px-4",
        "data-[size=lg]:text-sm",

        className
      )}
      {...props}
    />
  );
}

export { Input };


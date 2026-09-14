"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full resize-y",
        "rounded-xl border border-border",
        "bg-card text-foreground",
        "px-3 py-2.5",
        "text-sm leading-6",
        "placeholder:text-muted-foreground",

        "outline-none transition-all duration-200",

        "focus:border-border-light",
        "focus:ring-2 focus:ring-ring/20",

        "disabled:cursor-not-allowed",
        "disabled:opacity-50",
        "disabled:bg-card-2",

        "aria-invalid:border-destructive",
        "aria-invalid:ring-2",
        "aria-invalid:ring-destructive/20",

        className
      )}
      {...props}
    />
  );
}

export { Textarea };

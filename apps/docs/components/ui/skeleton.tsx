import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  animate?: boolean;
}

export function Skeleton({
  className,
  rounded = "md",
  animate = true,
  ...props
}: SkeletonProps) {
  const roundedClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      data-slot="skeleton"
      role="status"
      aria-label="Loading"
      className={cn(
        "relative overflow-hidden bg-muted",
        roundedClass,
        className,
      )}
      {...props}
    >
      {animate && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--foreground) 6%, transparent) 50%, transparent 100%)",
            animation: "skeleton-shimmer 1.6s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}
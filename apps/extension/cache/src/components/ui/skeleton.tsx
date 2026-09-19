import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  animate?: boolean;
};

const roundedClass: Record<string, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

export const Skeleton = ({ className, rounded = "md", animate = true, ...props }: SkeletonProps) => (
  <div
    data-slot="skeleton"
    role="status"
    aria-label="Loading"
    className={cn(
      "relative overflow-hidden bg-muted",
      roundedClass[rounded],
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
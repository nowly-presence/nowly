import type { ReactNode } from "react";
import { cn } from "@/ui/cn";

type FrameProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  className?: string;
  children: ReactNode;
};

export const Frame = ({ title, description, action, footer, padded = true, className, children }: FrameProps) => (
  <section className={cn("@container flex flex-col gap-1 rounded-lg border border-line bg-hover p-1", className)}>
    <div className="flex items-start justify-between gap-3 px-3 pt-2 pb-1.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="text-label-lg font-medium text-ink">{title}</h3>
        {description && <p className="text-label-md text-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
    <div className={cn("rounded-md border border-line bg-surface", padded ? "flex flex-col gap-4 p-4" : "divide-y divide-line overflow-hidden")}>
      {children}
    </div>
    {footer && <div className="flex items-center justify-between gap-3 px-3 py-1.5">{footer}</div>}
  </section>
);
import { cn } from "@nowly/ui/utils";
import type { PropsWithChildren, ReactNode } from "react";

export const Frame = ({ title, description, action, footer, padded = true, className, children }: PropsWithChildren<{
  title: string;
  description: string;
  action?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  className?: string;
}>) => (
  <section className={cn("@container flex flex-col gap-1 rounded-[16px] bg-foreground/4 p-1 ring-1 ring-foreground/10", className)}>
    <div className="flex items-start justify-between gap-3 px-3 pt-2 pb-1.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
    {children ? (
      <div
        className={cn("rounded-[12px] bg-background ring-1 ring-foreground/10", padded ? "flex flex-col gap-4 p-4" : "divide-y divide-border overflow-hidden")}
      >
        {children}
      </div>
    ) : null}
    {footer ? <div className="flex items-center justify-between gap-3 px-3 py-1.5">{footer}</div> : null}
  </section>
);
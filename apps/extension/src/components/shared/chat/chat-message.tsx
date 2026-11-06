import type { ReactNode } from "react";
import { cn } from "@/ui/cn";

type ChatMessageProps = {
  own: boolean;
  name: string;
  avatar?: ReactNode;
  meta?: ReactNode;
  tone?: "default" | "note";
  children: ReactNode;
};

export const ChatMessage = ({ own, name, avatar, meta, tone = "default", children }: ChatMessageProps) => (
  <div className={cn("flex max-w-[88%] gap-2.5", own ? "flex-row-reverse self-end" : "self-start")}>
    {avatar}
    <div className={cn("flex min-w-0 flex-col gap-1", own && "items-end")}>
      <div className="flex items-center gap-1.5 text-label-sm text-muted">
        <span className="truncate">{name}</span>
        {meta}
      </div>
      <p
        className={cn(
          "rounded-md px-3 py-2 text-body-sm break-words whitespace-pre-wrap",
          tone === "note" ? "border border-dashed border-line-strong bg-hover text-ink" : own ? "bg-primary-soft text-ink" : "bg-hover text-ink"
        )}
      >
        {children}
      </p>
    </div>
  </div>
);
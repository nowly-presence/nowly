import type { ReactNode } from "react";
import { cn } from "@/ui/cn";

type ChatMessageProps = {
  own: boolean;
  name: string;
  avatar?: ReactNode;
  meta?: ReactNode;
  tone?: "default" | "note";
  images?: string[];
  children: ReactNode;
};

export const ChatMessage = ({ own, name, avatar, meta, tone = "default", images = [], children }: ChatMessageProps) => (
  <div className={cn("flex max-w-[88%] gap-2.5", own ? "flex-row-reverse self-end" : "self-start")}>
    {avatar}
    <div className={cn("flex min-w-0 flex-col gap-1", own && "items-end")}>
      <div className="flex items-center gap-1.5 text-label-sm text-muted">
        <span className="truncate">{name}</span>
        {meta}
      </div>
      {images.length > 0 && (
        <div className={cn("flex flex-wrap gap-2", own && "justify-end")}>
          {images.map((source) => (
            <a key={source} href={source} target="_blank" rel="noreferrer">
              <img src={source} alt="" loading="lazy" className="max-h-40 max-w-48 rounded-md border border-line object-cover" />
            </a>
          ))}
        </div>
      )}
      {(children || images.length === 0) && (
        <p
          className={cn(
            "rounded-md px-3 py-2 text-body-sm break-words whitespace-pre-wrap",
            tone === "note" ? "border border-dashed border-line-strong bg-hover text-ink" : own ? "bg-primary-soft text-ink" : "bg-hover text-ink"
          )}
        >
          {children}
        </p>
      )}
    </div>
  </div>
);
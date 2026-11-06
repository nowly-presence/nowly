import type { ReactNode } from "react";
import { cn } from "@/ui/cn";

type ChatMessageProps = {
  own: boolean;
  name: string;
  avatar?: ReactNode;
  meta?: ReactNode;
  continued?: boolean;
  indent?: boolean;
  images?: string[];
  reactions?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

const AVATAR_SPACE = "w-7 shrink-0";

export const ChatMessage = ({ own, name, avatar, meta, continued = false, indent = false, images = [], reactions, actions, children }: ChatMessageProps) => (
  <div className={cn("group flex max-w-[88%] gap-2.5", own ? "flex-row-reverse self-end" : "self-start", continued && "-mt-3")}>
    {!own && indent && (continued || !avatar) ? <span aria-hidden className={AVATAR_SPACE} /> : avatar}
    <div className={cn("flex min-w-0 flex-col gap-1", own && "items-end")}>
      {!continued && (
        <div className="flex items-center gap-1.5 text-label-sm text-muted">
          <span className="truncate">{name}</span>
          {meta}
        </div>
      )}
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
        <div className="relative">
          <p className={cn("rounded-md px-3 py-2 text-body-sm break-words whitespace-pre-wrap text-ink", own ? "bg-primary-soft" : "bg-hover")}>{children}</p>
          {actions && <div className={cn("absolute -top-3", own ? "left-2" : "right-2")}>{actions}</div>}
        </div>
      )}
      {reactions && <div className="-mt-2 flex flex-wrap justify-end gap-1 px-2">{reactions}</div>}
    </div>
  </div>
);
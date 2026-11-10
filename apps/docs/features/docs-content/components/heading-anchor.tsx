import { RiLinksLine } from "@nowly/ui/icons";
import { cn } from "@nowly/ui";
import type { FC, ReactNode } from "react";

type HeadingAnchorProps = {
  as: "h1" | "h2" | "h3" | "h4";
  id: string;
  label?: string;
  children: ReactNode;
  className?: string;
};

export const HeadingAnchor: FC<HeadingAnchorProps> = ({ as: Tag, id, label, children, className }) => (
  <Tag id={id} className={cn("group relative scroll-mt-24", className)}>
    <a href={`#${id}`} className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100" aria-label={label ?? id}>
      <RiLinksLine size={16} className="text-muted-foreground" />
    </a>
    {children}
  </Tag>
);
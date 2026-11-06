import type { ReactNode } from "react";
import { RiLockLine } from "@remixicon/react";

type ChatNoteProps = {
  label: string;
  author: string;
  children: ReactNode;
};

export const ChatNote = ({ label, author, children }: ChatNoteProps) => (
  <div className="flex flex-col gap-1 rounded-md border border-dashed border-line-strong px-3 py-2">
    <div className="flex items-center gap-1.5 text-label-sm text-muted">
      <RiLockLine className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
      <span aria-hidden>/</span>
      <span className="truncate">{author}</span>
    </div>
    <p className="text-label-md break-words whitespace-pre-wrap text-muted">{children}</p>
  </div>
);
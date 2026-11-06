import { RiLockLine } from "@remixicon/react";

type ChatNoteProps = {
  label: string;
  author: string;
  body: string;
};

export const ChatNote = ({ label, author, body }: ChatNoteProps) => (
  <span title={label} className="flex max-w-full items-start gap-1.5 rounded-md border border-line-strong bg-canvas px-2 py-1 text-label-sm text-muted">
    <RiLockLine aria-label={label} className="mt-0.5 size-3 shrink-0" />
    <span className="min-w-0 break-words whitespace-pre-wrap">
      <span className="text-ink">{author}</span> {body}
    </span>
  </span>
);
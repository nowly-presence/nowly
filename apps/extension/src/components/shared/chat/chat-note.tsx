import { useId, useState } from "react";
import { RiLockLine } from "@remixicon/react";

type ChatNoteProps = {
  label: string;
  author: string;
  body: string;
};

export const ChatNote = ({ label, author, body }: ChatNoteProps) => {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={`${label}: ${author}`}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((current) => !current)}
        className="flex size-6 items-center justify-center rounded-full border border-line-strong bg-surface text-muted transition-colors hover:text-ink"
      >
        <RiLockLine className="size-3.5" />
      </button>
      {open && (
        <span id={id} role="tooltip" className="absolute right-0 bottom-full z-50 w-56 max-w-[70vw] pb-1.5">
          <span className="block rounded-md border border-line bg-surface p-2.5 text-label-md break-words whitespace-pre-wrap text-ink">
            <span className="mb-1 block text-label-sm text-muted">
              {label} / {author}
            </span>
            {body}
          </span>
        </span>
      )}
    </span>
  );
};
import { useRef, useState, type ReactNode } from "react";
import { RiArrowUpLine, RiCloseLine, RiImageAddLine } from "@remixicon/react";
import { readImageAttachment } from "@/lib/read-image-attachment";
import { REPORT_ATTACHMENTS_MAX } from "@/shared/reports";
import { Button } from "@/ui/button";
import { Textarea } from "@/ui/textarea";

type ChatPromptInputProps = {
  placeholder: string;
  sendLabel: string;
  attachLabel: string;
  removeLabel: string;
  maxLength: number;
  busy: boolean;
  disabled?: boolean;
  allowEmpty?: boolean;
  tools?: ReactNode;
  onAttachError: () => void;
  onSend: (message: string, attachments: string[]) => Promise<boolean>;
};

export const ChatPromptInput =
  ({ placeholder, sendLabel, attachLabel, removeLabel, maxLength, busy, disabled = false, allowEmpty = false, tools, onAttachError, onSend }: ChatPromptInputProps) => {
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);
    const canSend = (allowEmpty || value.trim().length > 0 || attachments.length > 0) && !busy && !disabled;

    const send = async () => {
      if (!canSend) return;

      if (await onSend(value.trim(), attachments)) {
        setValue("");
        setAttachments([]);
      }
    };

    const pick = async (files: FileList | null) => {
      const picked = await Promise.all(
        Array.from(files ?? [])
          .slice(0, REPORT_ATTACHMENTS_MAX - attachments.length)
          .map(readImageAttachment)
      );
      const valid = picked.filter((entry): entry is string => entry !== null);

      if (valid.length < picked.length || (files?.length ?? 0) > picked.length) onAttachError();

      setAttachments((current) => [...current, ...valid].slice(0, REPORT_ATTACHMENTS_MAX));

      if (fileRef.current) fileRef.current.value = "";
    };

    return (
      <div className="flex flex-col gap-2 rounded-md border border-line bg-surface p-2">
        <Textarea
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void send();
            }
          }}
          className="min-h-12! border-0 bg-transparent px-2 py-1.5"
        />
        {attachments.length > 0 && (
          <div className="flex gap-2 px-1">
            {attachments.map((source, index) => (
              <div key={index} className="relative size-14 overflow-hidden rounded-md border border-line">
                <img src={source} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  aria-label={removeLabel}
                  onClick={() => setAttachments((current) => current.filter((_, position) => position !== index))}
                  className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-overlay text-on-tertiary"
                >
                  <RiCloseLine className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg" multiple hidden onChange={(event) => void pick(event.target.files)} />
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={attachLabel}
            disabled={disabled || attachments.length >= REPORT_ATTACHMENTS_MAX}
            onClick={() => fileRef.current?.click()}
            icon={<RiImageAddLine />}
          />
          <div className="flex min-w-0 flex-1 items-center gap-2 *:min-w-0 *:truncate">{tools}</div>
          <Button
            className="ml-auto shrink-0"
            size="icon-sm"
            aria-label={sendLabel}
            disabled={!canSend}
            loading={busy}
            onClick={() => void send()}
            icon={<RiArrowUpLine />}
          />
        </div>
      </div>
    );
  };
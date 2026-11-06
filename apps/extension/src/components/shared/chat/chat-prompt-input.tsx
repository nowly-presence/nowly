import { useState, type ReactNode } from "react";
import { RiArrowUpLine } from "@remixicon/react";
import { Button } from "@/ui/button";
import { Textarea } from "@/ui/textarea";

type ChatPromptInputProps = {
  placeholder: string;
  sendLabel: string;
  maxLength: number;
  busy: boolean;
  disabled?: boolean;
  allowEmpty?: boolean;
  tools?: ReactNode;
  onSend: (message: string) => Promise<boolean>;
};

export const ChatPromptInput = ({ placeholder, sendLabel, maxLength, busy, disabled = false, allowEmpty = false, tools, onSend }: ChatPromptInputProps) => {
  const [value, setValue] = useState("");
  const canSend = (allowEmpty || value.trim().length > 0) && !busy && !disabled;

  const send = async () => {
    if (!canSend) return;

    if (await onSend(value.trim())) setValue("");
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
        className="min-h-12 border-0 bg-transparent px-2 py-1.5"
      />
      <div className="flex items-center gap-2">
        {tools}
        <span className="ml-auto text-label-sm text-muted tabular-nums">
          {value.length}/{maxLength}
        </span>
        <Button size="icon-sm" aria-label={sendLabel} disabled={!canSend} loading={busy} onClick={() => void send()} icon={<RiArrowUpLine />} />
      </div>
    </div>
  );
};
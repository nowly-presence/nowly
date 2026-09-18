"use client";
import { RiCheckLine, RiFileCopyLine } from "@nowly/ui/icons";

import { cn } from "@nowly/ui";


import { type FC, useCallback, useState } from "react";

type CopyButtonProps = {
  content: string;
  className?: string;
};

export const CopyButton: FC<CopyButtonProps> = ({ content, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
      aria-label={copied ? "Copied" : "RiFileCopyLine code"}
    >
      {copied ? <RiCheckLine size={14} /> : <RiFileCopyLine size={14} />}
    </button>
  );
};

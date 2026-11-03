import type { CodeToken, CodeTokenKind } from "@/lib/highlight";
import { cn } from "@/ui/cn";

const TOKEN_CLASSES: Record<CodeTokenKind, string> = {
  keyword: "text-primary",
  literal: "text-primary",
  name: "text-ink",
  string: "text-ink/55",
  plain: "text-muted"
};

export const CodeBlock = ({ tokens, title, className }: { tokens: CodeToken[]; title?: string; className?: string }) => (
  <div className={cn("overflow-hidden rounded-md border border-line bg-canvas", className)}>
    {title && (
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="size-2 rounded-full bg-ink/20" />
        <span className="size-2 rounded-full bg-ink/20" />
        <span className="size-2 rounded-full bg-ink/20" />
        <span className="ml-1.5 truncate font-mono text-label-sm text-muted">{title}</span>
      </div>
    )}
    <pre className="scroll-thin max-h-80 overflow-auto p-3 font-mono text-label-sm leading-[1.7]">
      <code>
        {tokens.map((token, index) => (
          <span key={index} className={TOKEN_CLASSES[token.kind]}>
            {token.text}
          </span>
        ))}
      </code>
    </pre>
  </div>
);
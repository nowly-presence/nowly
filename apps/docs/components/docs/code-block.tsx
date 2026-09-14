import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";
import {
  BashDark,
  CSS,
  HTML5,
  JavaScript,
  JSON,
  MarkdownDark,
  Python,
  ReactDark,
  TypeScript,
} from "@ridemountainpig/svgl-react";
import type { ReactNode } from "react";
import { codeToHtml } from "shiki";

type CodeBlockProps = {
  className?: string;
  children: ReactNode;
  filename?: string;
  language?: string;
  ["data-meta"]?: string;
};

const getCodeText = (children: ReactNode): string => {
  if (typeof children === "string") return children.trimEnd();
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(getCodeText).join("");

  return "";
};

const normalizeLanguage = (language: string): string => {
  const aliases: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    ps: "powershell",
    ps1: "powershell",
    json: "json",
    txt: "text",
  };

  return aliases[language] ?? language;
};

const languageIcons: Record<string, ReactNode> = {
  bash: <BashDark className="size-3.5" />,
  typescript: <TypeScript className="size-3.5" />,
  javascript: <JavaScript className="size-3.5" />,
  tsx: <ReactDark className="size-3.5" />,
  jsx: <JavaScript className="size-3.5" />,
  json: <JSON className="size-3.5" />,
  css: <CSS className="size-3.5" />,
  html: <HTML5 className="size-3.5" />,
  python: <Python className="size-3.5" />,
  markdown: <MarkdownDark className="size-3.5" />,
};

export const CodeBlock = async ({ className, children, filename, language, ["data-meta"]: dataMeta }: CodeBlockProps) => {
  const fromMeta = dataMeta?.match(/filename="([^"]+)"/)?.[1];
  const resolvedFilename = filename ?? fromMeta;

  const match = /language-([\w-]+)/.exec(className || "");
  const lang = language ?? (match ? match[1] : "");
  const code = getCodeText(children);

  let highlightedCode: string | null = null;

  if (lang) {
    try {
      highlightedCode = await codeToHtml(code, {
        lang: normalizeLanguage(lang),
        theme: "github-dark",
      });
    } catch {
      highlightedCode = null;
    }
  }

  return (
    <div className="group relative my-6 overflow-hidden rounded-lg border border-border bg-card">
      <div className="bg-muted/50 flex min-w-0 items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2 overflow-hidden">
          {lang && (
            languageIcons[normalizeLanguage(lang)] ?? (
              <code className="text-muted-foreground/60 text-xs font-semibold">
                {lang.toUpperCase()}
              </code>
            )
          )}
          {resolvedFilename && (
            <code className="text-muted-foreground truncate text-sm">
              {resolvedFilename}
            </code>
          )}
        </div>
        <CopyButton content={code} />
      </div>

      {highlightedCode ? (
        <div
          className={cn(
            "overflow-x-auto text-sm leading-relaxed",
            "[&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-4",
            "[&_code]:font-mono [&_code]:text-sm"
          )}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      ) : (
        <pre className="overflow-x-auto p-4 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-card-hover">
          <code className={cn("font-mono", className)}>{children}</code>
        </pre>
      )}
    </div>
  );
};

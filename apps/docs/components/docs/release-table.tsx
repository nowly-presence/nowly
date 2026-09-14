import { cn } from "@/lib/utils";
import type { FC, ReactNode } from "react";

type ReleaseTableProps = {
  headers: string[];
  rows: string[][];
  className?: string;
};

const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

function renderCell(text: string): ReactNode {
  if (!markdownLinkRegex.test(text)) {
    return text;
  }

  markdownLinkRegex.lastIndex = 0;

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        className="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent transition-colors"
      >
        {match[1]}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : parts;
}

export const ReleaseTable: FC<ReleaseTableProps> = ({ headers, rows, className }) => {
  return (
    <div className={cn("my-6 overflow-x-auto rounded-md border border-border", className)}>
      <table className="w-full min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {headers.map((header, index) => (
              <th
                key={header}
                className={cn(
                  "px-4 py-3 text-left text-sm font-semibold text-muted-foreground",
                  index < headers.length - 1 && "border-r border-border",
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row.join("|")}`} className="border-b border-border last:border-0 even:bg-muted/20">
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className={cn(
                    "px-4 py-3 align-top text-foreground/85",
                    cellIndex < row.length - 1 && "border-r border-border",
                  )}
                >
                  {renderCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

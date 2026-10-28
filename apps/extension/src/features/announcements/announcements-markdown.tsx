import { Fragment, type ReactNode } from "react";

export const safeAnnouncementLink = (value: string): string | null => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
};

const inline = (text: string, depth = 0): ReactNode => {
  if (depth > 4) return text;

  const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|!?\[[^\]\n]+\]\([^\s)]+\))/g;
  const result: ReactNode[] = [];
  let start = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index;
    result.push(text.slice(start, index));
    const token = match[0];
    let node: ReactNode = token;
    if (token.startsWith("`")) node = <code className="rounded-sm bg-hover px-1">{token.slice(1, -1)}</code>;
    else if (token.startsWith("**")) node = <strong>{inline(token.slice(2, -2), depth + 1)}</strong>;
    else if (token.startsWith("*")) node = <em>{inline(token.slice(1, -1), depth + 1)}</em>;
    else {
      const link = /^(!?)\[([^\]]+)\]\(([^)]+)\)$/.exec(token);

      if (link) {
        const href = safeAnnouncementLink(link[3]);
        node =
          href && !link[1] ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-primary underline-offset-4">
              {inline(link[2], depth + 1)}
            </a>
          ) : (
            link[2]
          );
      }
    }
    result.push(<Fragment key={index}>{node}</Fragment>);
    start = index + token.length;
  }

  result.push(text.slice(start));
  return result;
};

export const AnnouncementsMarkdown = ({ content }: {
  content: string;
}) => {
  const lines = content.replaceAll("\r\n", "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const key = index;

    if (!line.trim()) {
      index++;
      continue;
    }
    if (/^```/.test(line)) {
      const code: string[] = [];
      index++;

      while (index < lines.length && !/^```/.test(lines[index])) code.push(lines[index++]);

      index++;
      blocks.push(
        <pre key={key} className="overflow-x-auto rounded-sm bg-hover p-3 text-body-sm">
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);

    if (heading) {
      blocks.push(
        heading[1].length <= 2 ? (
          <h2 key={key} className="pt-2 text-title font-semibold text-ink">
            {inline(heading[2])}
          </h2>
        ) : (
          <h3 key={key} className="pt-1 text-title-sm font-semibold text-ink">
            {inline(heading[2])}
          </h3>
        )
      );
      index++;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const pattern = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*+]\s+/;
      const items: ReactNode[] = [];

      while (index < lines.length && pattern.test(lines[index])) {
        items.push(<li key={index}>{inline(lines[index++].replace(pattern, ""))}</li>);
      }

      blocks.push(
        ordered ? (
          <ol key={key} className="list-decimal space-y-2 pl-5">
            {items}
          </ol>
        ) : (
          <ul key={key} className="list-disc space-y-2 pl-5">
            {items}
          </ul>
        )
      );
      continue;
    }
    if (/^>\s?/.test(line)) {
      blocks.push(
        <blockquote key={key} className="border-l-2 border-primary pl-3 text-muted">
          {inline(line.replace(/^>\s?/, ""))}
        </blockquote>
      );
      index++;
      continue;
    }
    if (/^[-*_]{3,}\s*$/.test(line)) {
      blocks.push(<hr key={key} className="border-line" />);
      index++;
      continue;
    }

    const paragraph = [line];
    index++;

    while (index < lines.length && lines[index].trim() && !/^(#{1,6}\s|```|>|\s*[-*+]\s|\s*\d+\.\s)/.test(lines[index])) paragraph.push(lines[index++]);

    blocks.push(
      <p key={key} className="whitespace-pre-wrap">
        {inline(paragraph.join("\n"))}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 break-words text-body leading-relaxed text-ink">
      {blocks}
    </div>
  );
};
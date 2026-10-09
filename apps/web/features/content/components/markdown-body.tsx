import type { Block, Inline } from "@/features/content/lib/markdown";
import { docsHref } from "@/features/seo/lib/seo";
import { Link } from "@/i18n/navigation";
import { cn } from "@nowly/ui/utils";
import type { ReactNode } from "react";

const LINK_CLASS =
  "text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors hover:decoration-foreground/60";

const SAFE_EXTERNAL = /^(https?:\/\/|mailto:)/i;

const LEGACY_DOCS_ORIGIN = "https://docs.nowly.me";

// Content links to the docs are written with docs.nowly.me; follow the docs wherever they are served.
const resolveHref = (href: string): string =>
  href === LEGACY_DOCS_ORIGIN || href.startsWith(`${LEGACY_DOCS_ORIGIN}/`)
    ? docsHref(href.slice(LEGACY_DOCS_ORIGIN.length) || "/")
    : href;

const renderInline = (nodes: Inline[], keyPrefix: string): ReactNode[] =>
  nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (node.kind) {
      case "text":
        return node.text;
      case "strong":
        return (
          <strong key={key} className="font-medium text-foreground">
            {renderInline(node.children, key)}
          </strong>
        );
      case "code":
        return (
          <code key={key} className="rounded-md bg-code-surface px-1.5 py-0.5 font-mono text-[0.86em] text-foreground">
            {node.text}
          </code>
        );
      case "link":
        if (node.href.startsWith("/")) {
          return (
            <Link key={key} href={node.href} className={LINK_CLASS}>
              {renderInline(node.children, key)}
            </Link>
          );
        }
        if (node.href.startsWith("#")) {
          return (
            <a key={key} href={node.href} className={LINK_CLASS}>
              {renderInline(node.children, key)}
            </a>
          );
        }
        if (SAFE_EXTERNAL.test(node.href)) {
          return (
            <a key={key} href={resolveHref(node.href)} rel="noreferrer" target="_blank" className={LINK_CLASS}>
              {renderInline(node.children, key)}
            </a>
          );
        }
        return renderInline(node.children, key);
    }
  });

const renderBlock = (block: Block, index: number): ReactNode => {
  const key = `block-${index}`;
  switch (block.kind) {
    case "heading":
      return block.level === 2 ? (
        <h2 key={key} id={block.id} className="mt-14 scroll-mt-32 text-[1.45rem] font-medium leading-snug tracking-tight text-foreground first:mt-0">
          {renderInline(block.children, key)}
        </h2>
      ) : (
        <h3 key={key} id={block.id} className="mt-9 scroll-mt-32 text-lg font-medium leading-snug text-foreground">
          {renderInline(block.children, key)}
        </h3>
      );
    case "paragraph":
      return (
        <p key={key} className="mt-4 first:mt-0">
          {renderInline(block.children, key)}
        </p>
      );
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag key={key} className={cn("mt-4 flex flex-col gap-2 pl-5", block.ordered ? "list-decimal" : "list-disc")}>
          {block.items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`} className="pl-1 marker:text-muted-foreground">
              {renderInline(item, `${key}-${itemIndex}`)}
            </li>
          ))}
        </ListTag>
      );
    }
    case "note":
      return (
        <aside key={key} className="mt-6 rounded-2xl border border-accent/20 bg-accent/8 px-5 py-4 text-[0.95rem]">
          {block.children.map((paragraph, paragraphIndex) => (
            <p key={`${key}-${paragraphIndex}`} className="mt-2 first:mt-0">
              {renderInline(paragraph, `${key}-${paragraphIndex}`)}
            </p>
          ))}
        </aside>
      );
    case "code":
      return (
        <pre key={key} className="mt-5 overflow-x-auto rounded-xl bg-code-surface p-4 font-mono text-[13px] leading-relaxed text-foreground">
          <code>{block.text}</code>
        </pre>
      );
    case "table":
      return (
        <div key={key} className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-lg border-collapse text-left text-sm">
            <thead className="bg-foreground/4 text-foreground">
              <tr>
                {block.head.map((cell, cellIndex) => (
                  <th key={`${key}-h-${cellIndex}`} scope="col" className="px-4 py-3 font-medium">
                    {renderInline(cell, `${key}-h-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`${key}-r-${rowIndex}`} className="border-t border-border align-top">
                  {row.map((cell, cellIndex) => (
                    <td key={`${key}-r-${rowIndex}-${cellIndex}`} className="px-4 py-3">
                      {renderInline(cell, `${key}-r-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
};

export const MarkdownBody = ({ blocks, className }: { blocks: Block[]; className?: string }) => (
  <div className={cn("text-[1.02rem] leading-relaxed text-foreground/78", className)}>
    {blocks.map(renderBlock)}
  </div>
);

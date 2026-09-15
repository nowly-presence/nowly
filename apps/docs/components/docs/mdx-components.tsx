import type { ComponentType, FC, ReactNode } from "react";
import { Callout } from "./callout";
import { CodeBlock } from "./code-block";
import { Faq } from "./faq";
import { HeadingAnchor } from "./heading-anchor";
import { ReleaseTable } from "./release-table";
import { Step, Steps } from "./steps";
import { LanguageTable, TypeTable } from "./type-table";

type MDXComponents = Record<string, ComponentType<Record<string, unknown>>>;

type CodeProps = {
  className?: string;
  children?: ReactNode;
};

type InlineCodeProps = {
  children?: ReactNode;
};

const createSeparatedComponent = (
  Component: ComponentType<Record<string, unknown>>,
  displayName: string,
): ComponentType<Record<string, unknown>> => {
  const WrappedComponent: FC<Record<string, unknown>> = (props) => (
    <div className="mb-2 [&+div[data-component]]:mt-6" data-component={displayName}>
      <Component {...props} />
    </div>
  );

  WrappedComponent.displayName = `Separated(${displayName})`;
  return WrappedComponent;
};

export const mdxComponents: MDXComponents = {
  h1: (({ children, id, ...props }) => (
    <HeadingAnchor as="h1" id={id} className="text-3xl font-semibold mb-6 mt-0" {...props}>
      {children}
    </HeadingAnchor>
  )) as FC<{ children?: ReactNode; id?: string }>,

  h2: (({ children, id, ...props }) => (
    <HeadingAnchor as="h2" id={id} className="text-2xl font-semibold mt-12 mb-4" {...props}>
      {children}
    </HeadingAnchor>
  )) as FC<{ children?: ReactNode; id?: string }>,

  h3: (({ children, id, ...props }) => (
    <HeadingAnchor as="h3" id={id} className="text-xl font-semibold mt-8 mb-3" {...props}>
      {children}
    </HeadingAnchor>
  )) as FC<{ children?: ReactNode; id?: string }>,

  h4: (({ children, id, ...props }) => (
    <HeadingAnchor as="h4" id={id} className="text-lg font-semibold mt-6 mb-2" {...props}>
      {children}
    </HeadingAnchor>
  )) as FC<{ children?: ReactNode; id?: string }>,

  p: (({ children }) => (
    <p className="mb-4 leading-relaxed text-foreground/85">{children}</p>
  )) as FC<{ children?: ReactNode }>,

  ul: (({ children }) => (
    <ul className="mb-4 space-y-1.5 list-disc list-inside text-foreground/85">{children}</ul>
  )) as FC<{ children?: ReactNode }>,

  ol: (({ children }) => (
    <ol className="mb-4 space-y-1.5 list-decimal list-inside text-foreground/85">{children}</ol>
  )) as FC<{ children?: ReactNode }>,

  li: (({ children }) => (
    <li className="leading-relaxed">{children}</li>
  )) as FC<{ children?: ReactNode }>,

  code: (({ className, children, ...props }: CodeProps) => {
    if (className) {
      return (
        <CodeBlock className={className} {...props}>
          {children}
        </CodeBlock>
      );
    }

    if (typeof children === "string" && children.includes("\n")) {
      return (
        <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-sm leading-relaxed my-6 font-mono">
          {children}
        </pre>
      );
    }

    return (
      <code className="rounded bg-card-2 px-1.5 py-0.5 text-sm font-mono text-accent" {...props}>
        {children}
      </code>
    );
  }) as FC<CodeProps & InlineCodeProps>,

  pre: (({ children }) => <>{children}</>) as FC<{ children?: ReactNode }>,

  blockquote: (({ children }) => (
    <blockquote className="mb-4 border-l-2 border-accent/40 pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  )) as FC<{ children?: ReactNode }>,

  a: (({ href, children }) => {
    const isExternal = href?.startsWith("http");

    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent transition-colors"
      >
        {children}
      </a>
    );
  }) as FC<{ href?: string; children?: ReactNode }>,

  hr: () => <hr className="my-8 border-border" />,

  table: (({ children }) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  )) as FC<{ children?: ReactNode }>,

  thead: (({ children }) => (
    <thead className="border-b border-border">{children}</thead>
  )) as FC<{ children?: ReactNode }>,

  tbody: (({ children }) => <tbody>{children}</tbody>) as FC<{ children?: ReactNode }>,

  tr: (({ children }) => (
    <tr className="border-b border-border/50 last:border-0">{children}</tr>
  )) as FC<{ children?: ReactNode }>,

  th: (({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </th>
  )) as FC<{ children?: ReactNode }>,

  td: (({ children }) => (
    <td className="px-4 py-3 text-foreground/85">{children}</td>
  )) as FC<{ children?: ReactNode }>,

  Callout: (({ type = "info", children }: { type?: "info" | "warning" | "error"; children?: ReactNode }) => (
    <Callout type={type}>{children}</Callout>
  )) as FC<{ type?: "info" | "warning" | "error"; children?: ReactNode }>,

  CalloutInfo: (({ children }: { children?: ReactNode }) => (
    <Callout type="info">{children}</Callout>
  )) as FC<{ children?: ReactNode }>,

  CalloutWarning: (({ children }: { children?: ReactNode }) => (
    <Callout type="warning">{children}</Callout>
  )) as FC<{ children?: ReactNode }>,

  TypeTable: createSeparatedComponent(TypeTable, "TypeTable"),
  LanguageTable: createSeparatedComponent(LanguageTable as ComponentType<Record<string, unknown>>, "LanguageTable"),

  Steps: Steps as ComponentType<Record<string, unknown>>,
  Step: Step as ComponentType<Record<string, unknown>>,
  CodeBlock: CodeBlock as ComponentType<Record<string, unknown>>,
  Faq: Faq as ComponentType<Record<string, unknown>>,
  ReleaseTable: ReleaseTable as ComponentType<Record<string, unknown>>,
};
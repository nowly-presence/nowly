import { Link } from "@/i18n/navigation";
import { MARKETING_ORIGIN } from "@/lib/constants";
import type { ComponentType, FC, ReactNode } from "react";
import { Callout } from "./callout";
import { CodeBlock } from "./code-block";
import { Faq } from "./faq";
import { HeadingAnchor } from "./heading-anchor";
import { Step, Steps } from "./steps";
import { LanguageTable, TypeTable } from "./type-table";

type MDXComponents = Record<string, ComponentType<Record<string, unknown>>>;

const WEBSITE_PATHS = ["/library"];

type CodeProps = {
  className?: string;
  children?: ReactNode;
};

type InlineCodeProps = {
  children?: ReactNode;
};

const createSeparatedComponent = (Component: ComponentType<Record<string, unknown>>, displayName: string): ComponentType<Record<string, unknown>> => {
  const WrappedComponent: FC<Record<string, unknown>> = (props) => (
    <div className="mb-2 [&+div[data-component]]:mt-6" data-component={displayName}>
      <Component {...props} />
    </div>
  );

  WrappedComponent.displayName = `Separated(${displayName})`;
  return WrappedComponent;
};

const headingComponent = (Tag: "h1" | "h2" | "h3" | "h4", className: string): FC<Record<string, unknown>> => {
  const Heading: FC<{
    children?: ReactNode;
    id?: string;
    "data-heading-text"?: string;
  }> = ({ children, id, "data-heading-text": label, ...props }) =>
    id ? (
      <HeadingAnchor as={Tag} id={id} label={label} className={className} {...props}>
        {children}
      </HeadingAnchor>
    ) : (
      <Tag className={className} {...props}>
        {children}
      </Tag>
    );

  return Heading as FC<Record<string, unknown>>;
};

export const mdxComponents: MDXComponents = {
  h1: headingComponent("h1", "text-3xl font-semibold mb-6 mt-0"),
  h2: headingComponent("h2", "text-2xl font-semibold mt-10 mb-3"),
  h3: headingComponent("h3", "text-xl font-semibold mt-8 mb-3"),
  h4: headingComponent("h4", "text-lg font-semibold mt-6 mb-2"),

  p: (({ children }) => <p className="mb-4 leading-relaxed text-foreground/85">{children}</p>) as FC<{
    children?: ReactNode;
  }>,

  ul: (({ children }) => <ul className="mb-6 list-disc space-y-2 pl-5 text-foreground/85">{children}</ul>) as FC<{
    children?: ReactNode;
  }>,

  ol: (({ children }) => <ol className="mb-4 space-y-1.5 list-decimal list-inside text-foreground/85">{children}</ol>) as FC<{
    children?: ReactNode;
  }>,

  li: (({ children }) => <li className="leading-relaxed">{children}</li>) as FC<{
    children?: ReactNode;
  }>,

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

  pre: (({ children }) => <>{children}</>) as FC<{
    children?: ReactNode;
  }>,

  blockquote: (({ children }) => <blockquote className="mb-4 border-l-2 border-accent/40 pl-4 italic text-muted-foreground">{children}</blockquote>) as FC<{
    children?: ReactNode;
  }>,

  a: (({ href, children }) => {
    const isExternal = href?.startsWith("http");
    const className = "text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent transition-colors";

    if (href && WEBSITE_PATHS.some((path) => href === path || href.startsWith(`${path}/`))) {
      return (
        <a href={`${MARKETING_ORIGIN}${href}`} className={className}>
          {children}
        </a>
      );
    }

    if (href?.startsWith("/")) {
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
    }

    return (
      <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined} className={className}>
        {children}
      </a>
    );
  }) as FC<{
    href?: string;
    children?: ReactNode;
  }>,

  hr: () => <hr className="my-8 border-border" />,

  table: (({ children }) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  )) as FC<{
    children?: ReactNode;
  }>,

  thead: (({ children }) => <thead className="border-b border-border">{children}</thead>) as FC<{
    children?: ReactNode;
  }>,

  tbody: (({ children }) => <tbody>{children}</tbody>) as FC<{
    children?: ReactNode;
  }>,

  tr: (({ children }) => <tr className="border-b border-border/50 last:border-0">{children}</tr>) as FC<{
    children?: ReactNode;
  }>,

  th: (({ children }) => <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</th>) as FC<{
    children?: ReactNode;
  }>,

  td: (({ children }) => <td className="px-4 py-3 text-foreground/85">{children}</td>) as FC<{
    children?: ReactNode;
  }>,

  Callout: (({ type = "info", children }: { type?: "info" | "warning" | "error"; children?: ReactNode }) => <Callout type={type}>{children}</Callout>) as FC<{
    type?: "info" | "warning" | "error";
    children?: ReactNode;
  }>,

  CalloutInfo: (({ children }: { children?: ReactNode }) => <Callout type="info">{children}</Callout>) as FC<{
    children?: ReactNode;
  }>,

  CalloutWarning: (({ children }: { children?: ReactNode }) => <Callout type="warning">{children}</Callout>) as FC<{
    children?: ReactNode;
  }>,

  TypeTable: createSeparatedComponent(TypeTable, "TypeTable"),
  LanguageTable: createSeparatedComponent(LanguageTable as ComponentType<Record<string, unknown>>, "LanguageTable"),

  Steps: Steps as ComponentType<Record<string, unknown>>,
  Step: Step as ComponentType<Record<string, unknown>>,
  CodeBlock: CodeBlock as ComponentType<Record<string, unknown>>,
  Faq: Faq as ComponentType<Record<string, unknown>>
};
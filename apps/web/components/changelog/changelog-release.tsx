import { HeadingAnchor } from "@/components/docs/heading-anchor";
import { ReleaseTable } from "@/components/docs/release-table";
import { buttonVariants } from "@/components/ui/button";
import type { DocContent } from "@/lib/docs/types";
import { IconArrowRight, IconSparkles } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import type { ComponentType, FC, ReactElement, ReactNode } from "react";

type ChangelogReleaseProps = {
  version: string;
  doc: DocContent | null;
};

type MDXComponents = Record<string, ComponentType<Record<string, unknown>>>;

const changelogMdxComponents: MDXComponents = {
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
  p: (({ children }) => (
    <p className="mb-4 leading-relaxed text-foreground/85">{children}</p>
  )) as FC<{ children?: ReactNode }>,
  ul: (({ children }) => (
    <ul className="mb-4 list-inside list-disc space-y-1.5 text-foreground/85">{children}</ul>
  )) as FC<{ children?: ReactNode }>,
  ol: (({ children }) => (
    <ol className="mb-4 list-inside list-decimal space-y-1.5 text-foreground/85">{children}</ol>
  )) as FC<{ children?: ReactNode }>,
  li: (({ children }) => (
    <li className="leading-relaxed">{children}</li>
  )) as FC<{ children?: ReactNode }>,
  code: (({ children }) => (
    <code className="rounded bg-card-2 px-1.5 py-0.5 font-mono text-sm text-accent">{children}</code>
  )) as FC<{ children?: ReactNode }>,
  a: (({ href, children }) => (
    <a
      href={href}
      className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
    >
      {children}
    </a>
  )) as FC<{ href?: string; children?: ReactNode }>,
  hr: () => <hr className="my-8 border-border" />,
  ReleaseTable: ReleaseTable as ComponentType<Record<string, unknown>>,
};

export const ChangelogRelease = async ({
  version,
  doc,
}: ChangelogReleaseProps): Promise<ReactElement> => {
  const t = await getTranslations("changelog-page");

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 px-6 py-24">
      <div className="min-w-0 py-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
          <IconSparkles className="size-3.5" />
          {t("badge")}
        </div>

        <h1 className="mx-auto mb-4 max-w-2xl text-balance text-[2rem] font-extrabold tracking-tight md:text-[2.5rem]">
          {t("title")}
        </h1>

        <p className="mx-auto mb-6 max-w-xl text-balance text-muted-foreground">
          {t("description", { version })}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/library" className={buttonVariants({ variant: "primary", size: "md" })}>
            {t("library-cta")}
            <IconArrowRight className="size-4" />
          </Link>
          <Link href="/docs/changelog" className={buttonVariants({ variant: "outline", size: "md" })}>
            {t("docs-cta")}
          </Link>
        </div>
      </div>

      {doc ? (
        <article className="min-w-0 rounded-lg border border-border bg-card p-6 md:p-8">
          {doc.description ? (
            <p className="mb-8 text-lg text-muted-foreground">{doc.description}</p>
          ) : null}
          <MDXRemote source={doc.content} components={changelogMdxComponents} options={{ blockJS: false }} />
        </article>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 text-center md:p-8">
          <p className="text-sm leading-6 text-muted-foreground">{t("missing")}</p>
        </div>
      )}
    </div>
  );
};

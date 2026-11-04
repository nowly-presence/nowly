import type { PropsWithChildren } from "react";

export const PageHeader = ({ title, description, children }: PropsWithChildren<{
  title: string;
  description: string;
}>) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
    {children ? <div className="flex items-center gap-2">{children}</div> : null}
  </header>
);
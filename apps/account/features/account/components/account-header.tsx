import type { ReactNode } from "react";

export const AccountHeader = ({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) => (
  <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
    <div className="max-w-xl">
      <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">{title}</h1>
      <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">{description}</p>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </header>
);
import type { Heading } from "@/features/content/lib/markdown";
import { cn } from "@nowly/ui/utils";

export const ContentToc = ({ headings, title, className }: { headings: Heading[]; title: string; className?: string }) => {
  const items = headings.filter((heading) => heading.level === 2);
  if (items.length < 2) return null;

  return (
    <nav aria-label={title} className={cn("text-sm", className)}>
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <ol className="mt-4 flex flex-col gap-2.5 border-l border-border">
        {items.map((heading) => (
          <li key={heading.id} className="-ml-px border-l border-transparent pl-4 hover:border-foreground/40">
            <a href={`#${heading.id}`} className="block leading-snug text-muted-foreground transition-colors hover:text-foreground">
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};

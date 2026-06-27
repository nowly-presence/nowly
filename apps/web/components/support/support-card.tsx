import { cn } from "@/lib/utils";
import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import type { FC, ReactElement, SVGProps } from "react";

export type SupportCardProps = {
  title: string
  description: string
  href: string
  icon: FC<SVGProps<SVGSVGElement>>
  tone?: "default" | "discord"
};

export const SupportCard: FC<SupportCardProps> = ({
  title,
  description,
  href,
  icon: Icon,
  tone = "default",
}): ReactElement => {
  const isDiscord = tone === "discord";

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group min-w-0 rounded-lg border border-border bg-card p-5 transition-colors hover:border-border-light hover:bg-card-hover"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            isDiscord ? "bg-[#5865F2]/10 text-[#5865F2]" : "bg-accent/10 text-accent"
          )}
        >
          <Icon className="size-5" />
        </span>
        <IconExternalLink className="size-4 text-dim-foreground transition-colors group-hover:text-foreground" />
      </div>

      <h2 className="mb-2 wrap-break-word text-lg font-semibold text-foreground">{title}</h2>

      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </Link>
  );
};
import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import type { SocialLink } from "@/features/team/types";

type Props = {
  links: SocialLink[]
};

export const TeamSocialLinks: FC<Props> = ({ links }): ReactElement => {
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      {links.map((link) => {
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-w-0 items-center gap-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded border border-border bg-card text-dim-foreground transition-colors group-hover:text-foreground">
              <Icon className="size-3.5" />
            </span>

            <span className="min-w-0 truncate">{link.label}</span>
            <IconExternalLink className="size-3.5 shrink-0 text-dim-foreground" />
          </Link>
        );
      })}
    </div>
  );
};
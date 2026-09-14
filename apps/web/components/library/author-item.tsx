import { GitHubIcon } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Contributor } from "@/lib/data/presences";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { FC, ReactElement } from "react";

type Props = {
  contributor: Contributor
  label?: string
};

export const AuthorItem: FC<Props> = ({ contributor, label }): ReactElement => {
  const github = contributor.github?.replace(/^@/, "");
  const profileHref = github ? `/author/${github}` : undefined;
  const githubHref = github ? `https://github.com/${github}` : undefined;

  const inner = (
    <>
      <Avatar className="h-8 w-8 shrink-0">
        {contributor.avatar ? (
          <AvatarImage src={contributor.avatar} alt={contributor.name} />
        ) : null}
        <AvatarFallback>{contributor.name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <span className="text-sm text-foreground flex-1">{contributor.name}</span>
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-dim-foreground">
          {label}
        </span>
      )}
    </>
  );

  return (
    <div className="flex w-full items-center first:rounded-t-lg last:rounded-b-lg overflow-hidden">
      {profileHref ? (
        <Link
          href={profileHref}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 bg-card-2 px-3 py-2 transition-colors hover:bg-card-hover",
          )}
        >
          {inner}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3 bg-card-2 px-3 py-2">
          {inner}
        </div>
      )}
      {githubHref ? (
        <a
          href={githubHref}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 bg-card-2 px-3 py-2 text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
          aria-label={`${contributor.name} on GitHub`}
        >
          <GitHubIcon className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
};

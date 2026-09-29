import { RiGithubFill } from "@remixicon/react"
import { openUrl } from "@/shared/browser-links"
import { cn } from "@/ui/cn"

type Author = { name: string; github?: string }

type AuthorLinkVariant = "inline" | "row"

export const githubProfileUrl = (handle: string): string => `https://github.com/${handle}`

const VARIANT_CLASSES: Record<AuthorLinkVariant, { link: string; icon: string }> = {
  inline: {
    link: "inline-flex items-center gap-1 font-medium underline decoration-line-strong underline-offset-4 hover:decoration-primary",
    icon: "size-3.5",
  },
  row: { link: "flex items-center gap-1.5 text-label-md", icon: "size-4" },
}

export const AuthorLink = ({ author, variant = "inline" }: { author: Author; variant?: AuthorLinkVariant }) => {
  if (!author.github) return <span className={cn("text-ink", variant === "row" && "text-label-md")}>{author.name}</span>
  const github = author.github
  const classes = VARIANT_CLASSES[variant]
  return (
    <button
      type="button"
      onClick={() => openUrl(githubProfileUrl(github))}
      title={`github.com/${github}`}
      className={cn("text-ink transition-colors hover:text-primary", classes.link)}
    >
      <RiGithubFill className={classes.icon} />
      {author.name}
    </button>
  )
}

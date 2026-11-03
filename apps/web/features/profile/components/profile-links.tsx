import { parsePublicLink, socialKindOf, type SocialKind } from "@nowly/shared";
import { RiBlueskyFill, RiGithubFill, RiGlobalFill, RiInstagramFill, RiLinkedinBoxFill, RiRedditFill, RiTiktokFill, RiTwitchFill, RiTwitterXFill, RiYoutubeFill } from "@nowly/ui/icons";
import type { ComponentType } from "react";

type Platform = {
  label: string;
  icon: ComponentType<{
    className?: string;
  }>;
};

const PLATFORMS: Readonly<Record<Exclude<SocialKind, "website">, Platform>> = {
  github: {
    label: "GitHub",
    icon: RiGithubFill
  },
  x: {
    label: "X",
    icon: RiTwitterXFill
  },
  bluesky: {
    label: "Bluesky",
    icon: RiBlueskyFill
  },
  youtube: {
    label: "YouTube",
    icon: RiYoutubeFill
  },
  twitch: {
    label: "Twitch",
    icon: RiTwitchFill
  },
  tiktok: {
    label: "TikTok",
    icon: RiTiktokFill
  },
  instagram: {
    label: "Instagram",
    icon: RiInstagramFill
  },
  reddit: {
    label: "Reddit",
    icon: RiRedditFill
  },
  linkedin: {
    label: "LinkedIn",
    icon: RiLinkedinBoxFill
  }
};

const describe = (link: string):
  | (Platform & {
      href: string;
    })
  | null => {
  const url = parsePublicLink(link);

  if (!url) return null;

  const kind = socialKindOf(link);
  const platform = kind === "website" ? { label: url.hostname.replace(/^www\./, ""), icon: RiGlobalFill } : PLATFORMS[kind];
  return {
    ...platform,
    href: url.toString()
  };
};

export const ProfileLinks = ({ links }: {
  links: string[];
}) => {
  const items = links.map(describe).filter((item) => item !== null);

  if (items.length === 0) return null;

  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            rel="noopener noreferrer nofollow ugc"
            target="_blank"
            className="flex items-center gap-2 rounded-full bg-foreground/[0.06] py-1.5 pr-3.5 pl-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <item.icon className="size-4" />
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
};
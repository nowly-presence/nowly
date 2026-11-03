import { parsePublicLink, socialKindOf, type SocialKind } from "@nowly/shared";
import { SocialIcon } from "@nowly/ui/social-icon";

const LABELS: Readonly<Record<Exclude<SocialKind, "website">, string>> = {
  github: "GitHub",
  x: "X",
  bluesky: "Bluesky",
  youtube: "YouTube",
  twitch: "Twitch",
  tiktok: "TikTok",
  instagram: "Instagram",
  reddit: "Reddit",
  linkedin: "LinkedIn"
};

const describe = (link: string): {
  href: string;
  kind: SocialKind;
  label: string;
} | null => {
  const url = parsePublicLink(link);

  if (!url) return null;

  const kind = socialKindOf(link);
  return {
    href: url.toString(),
    kind,
    label: kind === "website" ? url.hostname.replace(/^www\./, "") : LABELS[kind]
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
            className="flex items-center gap-2 rounded-xl bg-foreground/[0.06] py-1.5 pr-3.5 pl-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SocialIcon kind={item.kind} className="size-4" />
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
};
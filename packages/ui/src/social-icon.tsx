import { RiBlueskyFill, RiGithubFill, RiGlobalLine, RiInstagramFill, RiLinkedinBoxFill, RiRedditFill, RiTiktokFill, RiTwitchFill, RiTwitterXFill, RiYoutubeFill } from "@remixicon/react";
import type { ComponentType } from "react";

type IconComponent = ComponentType<{
  className?: string;
}>;

const SOCIAL_ICONS: Readonly<Record<string, IconComponent>> = {
  github: RiGithubFill,
  x: RiTwitterXFill,
  bluesky: RiBlueskyFill,
  youtube: RiYoutubeFill,
  twitch: RiTwitchFill,
  tiktok: RiTiktokFill,
  instagram: RiInstagramFill,
  reddit: RiRedditFill,
  linkedin: RiLinkedinBoxFill
};

export const SocialIcon = ({ kind, className }: {
  kind: string;
  className?: string;
}) => {
  const Icon = SOCIAL_ICONS[kind] ?? RiGlobalLine;
  return <Icon className={className} />;
};
import { GitHubIcon, LinkedInIcon, XIcon } from "@/components/icons";
import { IconGlobe, IconMail } from "@tabler/icons-react";
import type { FC, SVGProps } from "react";
import type { GithubMember, GithubSocialAccount, SocialLink } from "./types";

export const normalizeUrl = (url: string): string => {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
};

export const getHostLabel = (url: string): string => {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export const getSocialLabel = (account: GithubSocialAccount): string => {
  if (account.display_name) return account.display_name;

  try {
    const url = new URL(account.url);
    const pathname = url.pathname.replace(/^\/+/, "").replace(/\/+$/, "");

    if (url.hostname.includes("x.com") || url.hostname.includes("twitter.com")) return `@${pathname}`;
    if (url.hostname.includes("linkedin.com")) return pathname;

    return pathname || getHostLabel(account.url);
  } catch {
    return account.url;
  }
};

export const getSocialIcon = (account: GithubSocialAccount): FC<SVGProps<SVGSVGElement>> => {
  const provider = account.provider.toLowerCase();
  const url = account.url.toLowerCase();

  if (provider === "twitter" || provider === "x" || url.includes("x.com") || url.includes("twitter.com")) return XIcon;
  if (provider === "linkedin" || url.includes("linkedin.com")) return LinkedInIcon;

  return IconGlobe;
};

export const getSocialLinks = (member: GithubMember, labels: { github: string }): SocialLink[] => {
  const profile = member.profile;
  if (!profile) return [];

  const links: SocialLink[] = [
    { label: labels.github, href: profile.html_url, icon: GitHubIcon },
  ];
  const seen = new Set<string>([profile.html_url]);

  if (profile.email) {
    links.push({
      label: profile.email,
      href: `mailto:${profile.email}`,
      icon: IconMail,
    });
  }

  if (profile.blog) {
    const href = normalizeUrl(profile.blog);

    if (!seen.has(href)) {
      links.push({
        label: getHostLabel(profile.blog),
        href,
        icon: IconGlobe,
      });
      seen.add(href);
    }
  }

  if (profile.twitter_username) {
    const href = `https://x.com/${profile.twitter_username}`;

    if (!seen.has(href)) {
      links.push({
        label: `@${profile.twitter_username}`,
        href,
        icon: XIcon,
      });
      seen.add(href);
    }
  }

  for (const account of member.socials) {
    const href = normalizeUrl(account.url);

    if (seen.has(href)) continue;

    links.push({
      label: getSocialLabel(account),
      href,
      icon: getSocialIcon(account),
    });
    seen.add(href);
  }

  return links;
};
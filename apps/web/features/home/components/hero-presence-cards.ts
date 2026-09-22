type TimestampConfig =
  | { kind: "none" }
  | { kind: "elapsed"; icon?: string; color?: string }
  | { kind: "progress"; progress: number };

export type PresenceCardConfig = {
  id: string
  messageKey: string
  largeImage: string
  largeContain?: boolean
  smallImage?: string
  hasSubtitle: boolean
  timestamp: TimestampConfig
  hasButton: boolean
  buttonHref?: string
};

export const HERO_PRESENCE_CARDS: PresenceCardConfig[] = [
  {
    id: "netflix",
    messageKey: "netflix",
    largeImage: "/media/hero/cards/netflix-thumbnail.png",
    smallImage: "/media/hero/cards/play-badge.svg",
    hasSubtitle: true,
    timestamp: { kind: "progress", progress: 2.6 },
    hasButton: true
  },
  {
    id: "prime",
    messageKey: "prime",
    largeImage: "/media/hero/cards/prime-thumbnail.png",
    smallImage: "/media/hero/cards/play-badge.svg",
    hasSubtitle: true,
    timestamp: { kind: "progress", progress: 31.4 },
    hasButton: true
  },
  {
    id: "figma",
    messageKey: "figma",
    largeImage: "/media/hero/cards/figma-thumbnail.png",
    smallImage: "/media/hero/cards/figma-badge.png",
    hasSubtitle: true,
    timestamp: { kind: "elapsed" },
    hasButton: false
  },
  {
    id: "youtube",
    messageKey: "youtube",
    largeImage: "/media/hero/cards/youtube-thumbnail.jpg",
    smallImage: "/media/hero/cards/play-badge.svg",
    hasSubtitle: true,
    timestamp: { kind: "progress", progress: 52.9 },
    hasButton: true
  },
  {
    id: "twitch",
    messageKey: "twitch",
    largeImage: "/media/hero/cards/twitch-streamer-avatar.svg",
    hasSubtitle: true,
    timestamp: { kind: "elapsed" },
    hasButton: true
  },
  {
    id: "chatgpt",
    messageKey: "chatgpt",
    largeImage: "/media/hero/cards/chatgpt-logo.png",
    largeContain: true,
    hasSubtitle: false,
    timestamp: { kind: "elapsed" },
    hasButton: true
  },
  {
    id: "notion",
    messageKey: "notion",
    largeImage: "/media/hero/cards/notion-logo.png",
    largeContain: true,
    hasSubtitle: true,
    timestamp: { kind: "elapsed" },
    hasButton: false
  },
  {
    id: "steam",
    messageKey: "steam",
    largeImage: "/media/hero/cards/steam-minecraft-legends.jpg",
    hasSubtitle: true,
    timestamp: { kind: "elapsed" },
    hasButton: true
  },
  {
    id: "github",
    messageKey: "github",
    largeImage: "/media/hero/cards/github-org-avatar.png",
    hasSubtitle: true,
    timestamp: { kind: "elapsed" },
    hasButton: true,
    buttonHref: "https://github.com/nowly-presence/nowly/pull/39"
  }
];

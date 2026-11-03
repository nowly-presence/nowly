export const PUBLIC_HANDLE_PATTERN = /^[a-z0-9][a-z0-9_-]{2,29}$/;

export const PUBLIC_BIO_MAX_LENGTH = 280;

export const RESERVED_PUBLIC_HANDLES: readonly string[] = [
  "admin",
  "administrator",
  "api",
  "account",
  "nowly",
  "moderator",
  "mod",
  "staff",
  "support",
  "system",
  "root",
  "help",
  "me",
  "null",
  "undefined"
];

export const isValidPublicHandle = (value: string): boolean => PUBLIC_HANDLE_PATTERN.test(value) && !RESERVED_PUBLIC_HANDLES.includes(value);

const HANDLE_MAX_LENGTH = 30;
const HANDLE_MIN_LENGTH = 3;
const HANDLE_SUFFIX_RESERVE = 5;
const HANDLE_FALLBACK = "user";

export const deriveHandleBase = (source: string | null | undefined): string => {
  const cleaned = (source ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^[^a-z0-9]+/, "")
    .slice(0, HANDLE_MAX_LENGTH - HANDLE_SUFFIX_RESERVE);
  const base = cleaned.length >= HANDLE_MIN_LENGTH ? cleaned : `${cleaned}${HANDLE_FALLBACK}`.slice(0, HANDLE_MAX_LENGTH - HANDLE_SUFFIX_RESERVE);
  return RESERVED_PUBLIC_HANDLES.includes(base) ? `${base}_` : base;
};

export const handleCandidate = (base: string, attempt: number): string => (attempt === 0 ? base : `${base}${attempt + 1}`);

export const PUBLIC_LINKS_MAX = 5;
export const PUBLIC_LINK_MAX_LENGTH = 200;

export const SOCIAL_KINDS = ["github", "x", "bluesky", "youtube", "twitch", "tiktok", "instagram", "reddit", "linkedin", "website"] as const;

export type SocialKind = (typeof SOCIAL_KINDS)[number];

const SOCIAL_HOSTS: ReadonlyArray<readonly [SocialKind, readonly string[]]> = [
  [
    "github",
    ["github.com"]
  ],
  [
    "x",
    ["x.com", "twitter.com"]
  ],
  [
    "bluesky",
    ["bsky.app"]
  ],
  [
    "youtube",
    ["youtube.com", "youtu.be"]
  ],
  [
    "twitch",
    ["twitch.tv"]
  ],
  [
    "tiktok",
    ["tiktok.com"]
  ],
  [
    "instagram",
    ["instagram.com"]
  ],
  [
    "reddit",
    ["reddit.com"]
  ],
  [
    "linkedin",
    ["linkedin.com"]
  ]
];

export const parsePublicLink = (value: string): URL | null => {
  const trimmed = value.trim();

  if (!trimmed || trimmed.length > PUBLIC_LINK_MAX_LENGTH) return null;

  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" && !url.username && !url.password && url.hostname.includes(".") ? url : null;
  } catch {
    return null;
  }
};

export const socialKindOf = (value: string): SocialKind => {
  const host =
    parsePublicLink(value)
      ?.hostname.toLowerCase()
      .replace(/^www\./, "") ?? "";
  const match = SOCIAL_HOSTS.find(([, hosts]) => hosts.some((entry) => host === entry || host.endsWith(`.${entry}`)));
  return match?.[0] ?? "website";
};
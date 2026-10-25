import { AnnouncementFeedSchema, isAnnouncementBannerEligible, isAnnouncementVisible, type Announcement } from "@nowly/shared/announcements";

export const ANNOUNCEMENTS_KEY = "announcements";
export const ANNOUNCEMENTS_ALARM = "announcements-refresh";
export const ANNOUNCEMENTS_POLL_MS = 30_000;
export const ANNOUNCEMENTS_HISTORY_LIMIT = 500;

export type AnnouncementsState = {
  items: Announcement[];
  fetchedAt: number | null;
  offline: boolean;
  read: string[];
  locale: string;
  apiBaseUrl: string;
};

export const emptyAnnouncements = (): AnnouncementsState => ({
  items: [],
  fetchedAt: null,
  offline: false,
  read: [],
  locale: "en",
  apiBaseUrl: ""
});

export const normalizeAnnouncements = (value: unknown): AnnouncementsState => {
  if (!value || typeof value !== "object") return emptyAnnouncements();

  const raw = value as Record<string, unknown>;
  const feed = AnnouncementFeedSchema.safeParse({ items: raw.items });

  if (!feed.success) return emptyAnnouncements();

  const history = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length <= 150).slice(-ANNOUNCEMENTS_HISTORY_LIMIT) : [];
  return {
    items: feed.data.items,
    fetchedAt: typeof raw.fetchedAt === "number" && Number.isFinite(raw.fetchedAt) && raw.fetchedAt > 0 ? raw.fetchedAt : null,
    offline: raw.offline !== false,
    read: history(raw.read),
    locale: typeof raw.locale === "string" && /^(en|fr|es|de|pt-BR|pl|ja|ko|tr|ms|el)$/.test(raw.locale) ? raw.locale : "en",
    apiBaseUrl: typeof raw.apiBaseUrl === "string" ? raw.apiBaseUrl : ""
  };
};

export const visibleAnnouncements = (state: AnnouncementsState, now = Date.now()) => state.items.filter((item) => isAnnouncementVisible(item, now));

export const pinnedAnnouncement = (state: AnnouncementsState, now = Date.now()) =>
  state.items
    .filter((item) => isAnnouncementBannerEligible(item, now))
    .sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0] ?? null;

export const estimatedMinutes = (item: Announcement, now: number): number | null =>
  item.endsAt && Date.parse(item.endsAt) > now ? Math.ceil((Date.parse(item.endsAt) - now) / 60_000) : null;
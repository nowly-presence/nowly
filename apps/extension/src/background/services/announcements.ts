import { getEffectiveApiUrl } from "@/background/services/api-state";
import { getAnnouncements, updateAnnouncements } from "@/background/storage/announcements.store";
import { emptyAnnouncements, type AnnouncementsState } from "@/shared/announcements";
import { ANNOUNCEMENT_FEED_LIMIT, AnnouncementFeedSchema } from "@nowly/shared/announcements";

const REQUEST_TIMEOUT_MS = 10_000;
let queue: Promise<unknown> = Promise.resolve();
let pending: {
  key: string;
  result: Promise<AnnouncementsState>;
} | null = null;

export const getAnnouncementsSnapshot = async (): Promise<AnnouncementsState> => {
  const cached = await getAnnouncements();

  const apiBaseUrl = getEffectiveApiUrl();
  return cached.apiBaseUrl === apiBaseUrl ? cached : { ...emptyAnnouncements(), apiBaseUrl };
};

export const refreshAnnouncements = (locale?: string): Promise<AnnouncementsState> => {
  const apiBaseUrl = getEffectiveApiUrl();
  const key = `${apiBaseUrl}:${locale ?? "cached"}`;

  if (pending?.key === key) return pending.result;

  const result = queue.then(async () => {
    const cached = await getAnnouncementsSnapshot();

    const selectedLocale = locale ?? cached.locale;

    try {
      const url = new URL(`${apiBaseUrl}/announcements`);

      if (
        url.username ||
        url.password ||
        (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
      ) throw new Error("INVALID_ENDPOINT");

      url.searchParams.set("locale", selectedLocale);
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        redirect: "error"
      });

      if (!response.ok || Number(response.headers.get("content-length")) > ANNOUNCEMENT_FEED_LIMIT) throw new Error("INVALID_FEED");

      const reader = response.body?.getReader();

      if (!reader) throw new Error("INVALID_FEED");

      let text = "";
      let bytes = 0;
      const decoder = new TextDecoder();

      try {
        while (true) {
          const chunk = await reader.read();

          if (chunk.done) break;

          bytes += chunk.value.byteLength;

          if (bytes > ANNOUNCEMENT_FEED_LIMIT) throw new Error("FEED_TOO_LARGE");

          text += decoder.decode(chunk.value, { stream: true });
        }

        text += decoder.decode();
      } finally {
        await reader.cancel().catch(() => {});
      }

      const feed = AnnouncementFeedSchema.parse(JSON.parse(text));

      if (getEffectiveApiUrl() !== apiBaseUrl) return getAnnouncementsSnapshot();

      return updateAnnouncements((latest) => ({
        ...latest,
        items: feed.items,
        fetchedAt: Date.now(),
        offline: false,
        locale: selectedLocale,
        apiBaseUrl
      }));
    } catch {
      if (getEffectiveApiUrl() !== apiBaseUrl) return getAnnouncementsSnapshot();

      return updateAnnouncements((latest) => ({
        ...(latest.apiBaseUrl === apiBaseUrl ? latest : { ...emptyAnnouncements(), apiBaseUrl }),
        offline: true
      }));
    }
  });
  queue = result.catch(() => {});
  pending = { key, result };
  void result
    .finally(() => {
      if (pending?.result === result) pending = null;
    })
    .catch(() => {});
  return result;
};
import type { Handler } from "@/background/router/router";
import { getAnnouncementsSnapshot, refreshAnnouncements } from "@/background/services/announcements";
import { updateAnnouncements } from "@/background/storage/announcements.store";
import { ANNOUNCEMENTS_HISTORY_LIMIT } from "@/shared/announcements";
import { ANNOUNCEMENT_LOCALES, announcementRevision } from "@nowly/shared/announcements";

export const handleGetAnnouncements: Handler<"GET_ANNOUNCEMENTS"> = () => getAnnouncementsSnapshot();

export const handleRefreshAnnouncements: Handler<"REFRESH_ANNOUNCEMENTS"> = (payload) => {
  const locale = payload?.locale;

  if (!ANNOUNCEMENT_LOCALES.some((supported) => supported === locale)) return getAnnouncementsSnapshot();

  return refreshAnnouncements(locale);
};

export const handleMarkAnnouncement: Handler<"MARK_ANNOUNCEMENT"> = (payload) =>
  updateAnnouncements((state) => {
    const id = payload?.id;
    const action = payload?.action;
    const item = state.items.find((item) => item.id === id);

    if (!item || action !== "read") return state;

    return {
      ...state,
      read: [
        ...new Set([
          ...state.read,
          announcementRevision(item)
        ])
      ].slice(-ANNOUNCEMENTS_HISTORY_LIMIT)
    };
  });
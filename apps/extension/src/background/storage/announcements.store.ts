import { ANNOUNCEMENTS_KEY, normalizeAnnouncements, type AnnouncementsState } from "@/shared/announcements";

export const getAnnouncements = async (): Promise<AnnouncementsState> => {
  const data = await chrome.storage.local.get(ANNOUNCEMENTS_KEY);
  return normalizeAnnouncements(data[ANNOUNCEMENTS_KEY]);
};

let queue: Promise<unknown> = Promise.resolve();

export const updateAnnouncements = (change: (state: AnnouncementsState) => AnnouncementsState): Promise<AnnouncementsState> => {
  const result = queue.then(async () => {
    const next = normalizeAnnouncements(change(await getAnnouncements()));
    await chrome.storage.local.set({ [ANNOUNCEMENTS_KEY]: next });
    return next;
  });
  queue = result.catch(() => {});
  return result;
};
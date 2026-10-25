import { ANNOUNCEMENTS_POLL_MS } from "@/shared/announcements";

export const startAnnouncementUpdates = (apiBaseUrl: string, refresh: () => Promise<void>): (() => void) => {
  let stream: EventSource | null = null;
  let stopped = false;
  let refreshing = false;
  let queued = false;
  const update = async () => {
    if (stopped || document.visibilityState === "hidden") return;
    if (refreshing) {
      queued = true;
      return;
    }

    refreshing = true;

    try {
      await refresh();
    } catch {
    } finally {
      refreshing = false;

      if (queued) {
        queued = false;
        void update();
      }
    }
  };
  const connect = () => {
    stream?.close();
    stream = null;

    if (stopped || document.visibilityState === "hidden") return;

    void update();

    if (!apiBaseUrl || typeof EventSource === "undefined") return;

    try {
      const url = new URL(`${apiBaseUrl}/announcements/events`);

      if (url.username || url.password) return;

      if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return;

      stream = new EventSource(url.href);
      stream.addEventListener("invalidate", () => void update());
    } catch {}
  };
  connect();
  const timer = window.setInterval(() => void update(), ANNOUNCEMENTS_POLL_MS);
  document.addEventListener("visibilitychange", connect);
  window.addEventListener("online", connect);
  window.addEventListener("focus", update);
  return () => {
    stopped = true;
    stream?.close();
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", connect);
    window.removeEventListener("online", connect);
    window.removeEventListener("focus", update);
  };
};
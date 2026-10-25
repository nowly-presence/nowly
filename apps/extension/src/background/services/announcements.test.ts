import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnnouncementSchema } from "@nowly/shared/announcements";
import { installChromeMock } from "@/test/chrome-mock";
import { refreshAnnouncements, getAnnouncementsSnapshot } from "@/background/services/announcements";
import { getAnnouncements } from "@/background/storage/announcements.store";
import { ANNOUNCEMENTS_KEY, pinnedAnnouncement } from "@/shared/announcements";
import type { PayloadOf } from "@/background/router/contracts";
import { handleMarkAnnouncement } from "@/background/router/handlers/announcements.handlers";

vi.mock("@/background/services/api-state", () => ({
  getEffectiveApiUrl: () => "https://api.example.com"
}));

const notice = AnnouncementSchema.parse({
  id: "notice",
  source: "announcement",
  translations: {
    en: {
      title: "Hello",
      description: "Details"
    }
  },
  kind: "normal",
  publishedAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z"
});

describe("announcement fetch and offline recovery", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    installChromeMock();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());
  it("validates and persists public data without sending credentials", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        items: [notice]
      })
    );
    const result = await refreshAnnouncements("en");
    expect(result.offline).toBe(false);
    expect(result.items).toEqual([notice]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        credentials: "omit",
        cache: "no-store"
      })
    );
    expect(await getAnnouncements()).toEqual(result);
    expect(await getAnnouncementsSnapshot()).toEqual(result);
  });
  it("retains the last valid feed on malformed responses and network failures, then recovers", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        items: [notice]
      })
    );
    const saved = await refreshAnnouncements("en");
    fetchMock.mockResolvedValueOnce(
      Response.json({
        items: [
          {
            ...notice,
            kind: "execute"
          }
        ]
      })
    );
    expect(await refreshAnnouncements("en")).toEqual({
      ...saved,
      offline: true
    });
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect((await refreshAnnouncements("en")).items).toEqual([notice]);
    fetchMock.mockResolvedValueOnce(
      Response.json({
        items: []
      })
    );
    expect((await refreshAnnouncements("en")).offline).toBe(false);
    expect((await getAnnouncements()).items).toEqual([]);
  });
  it("rejects oversized responses and isolates caches from another API", async () => {
    fetchMock.mockResolvedValue(
      new Response("{}", {
        headers: { "content-length": "3000001" }
      })
    );
    expect((await refreshAnnouncements("en")).offline).toBe(true);
    await chrome.storage.local.set({
      [ANNOUNCEMENTS_KEY]: {
        ...(await getAnnouncements()),
        items: [notice],
        apiBaseUrl: "https://other.example.com"
      }
    });
    expect((await getAnnouncementsSnapshot()).items).toEqual([]);
  });

  it("persists read history alongside refresh without losing the local change", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        items: [notice]
      })
    );
    await refreshAnnouncements("en");
    await Promise.all([
      handleMarkAnnouncement(
        {
          id: notice.id,
          action: "read"
        },
        {}
      ),
      refreshAnnouncements("en")
    ]);
    const state = await getAnnouncements();
    expect(state.read).toEqual([`${notice.id}:${notice.updatedAt}`]);
    expect(state.items).toEqual([notice]);
  });

  it("cannot dismiss maintenance through legacy storage or untyped runtime requests", async () => {
    const maintenance = AnnouncementSchema.parse({
      ...notice,
      kind: "maintenance",
      pinned: true
    });
    fetchMock.mockResolvedValue(
      Response.json({
        items: [maintenance]
      })
    );
    const saved = await refreshAnnouncements("en");
    await chrome.storage.local.set({
      [ANNOUNCEMENTS_KEY]: {
        ...saved,
        dismissed: [`${maintenance.id}:${maintenance.updatedAt}`]
      }
    });
    const payload: unknown = {
      id: maintenance.id,
      action: "dismiss"
    };
    const result = await handleMarkAnnouncement(payload as PayloadOf<"MARK_ANNOUNCEMENT">, {});
    expect("dismissed" in result).toBe(false);
    expect(pinnedAnnouncement(result)).toEqual(maintenance);
    expect(pinnedAnnouncement(await getAnnouncementsSnapshot())).toEqual(maintenance);
    fetchMock.mockResolvedValue(
      Response.json({
        items: [
          {
            ...maintenance,
            dismissed: true
          }
        ]
      })
    );
    const rejectedNetworkDismissal = await refreshAnnouncements("en");
    expect(rejectedNetworkDismissal.offline).toBe(true);
    expect(pinnedAnnouncement(rejectedNetworkDismissal)).toEqual(maintenance);
  });
});
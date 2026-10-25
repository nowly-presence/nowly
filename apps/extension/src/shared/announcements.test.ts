import { describe, expect, it } from "vitest";
import { AnnouncementSchema, announcementRevision, selectAnnouncementTranslation } from "@nowly/shared/announcements";
import { emptyAnnouncements, estimatedMinutes, normalizeAnnouncements, pinnedAnnouncement, visibleAnnouncements } from "@/shared/announcements";

const now = Date.parse("2026-10-24T12:00:00Z");

const item = (overrides: Record<string, unknown> = {}) =>
  AnnouncementSchema.parse({
    id: "notice",
    translations: {
      fr: {
        title: "Information",
        description: "Description",
        content: ""
      }
    },
    source: "announcement",
    kind: "normal",
    pinned: true,
    publishedAt: "2026-10-24T11:00:00Z",
    updatedAt: "2026-10-24T11:00:00Z",
    ...overrides
  });

describe("announcement view model and cache", () => {
  it("filters scheduled, future and explicitly expired notices but retains estimated-end notices offline", () => {
    const state = {
      ...emptyAnnouncements(),
      items: [
        item(),
        item({
          id: "scheduled",
          startsAt: "2026-10-25T00:00:00Z"
        }),
        item({
          id: "future",
          publishedAt: "2026-10-25T00:00:00Z"
        }),
        item({
          id: "ended",
          endsAt: "2026-10-24T12:00:00Z"
        }),
        item({
          id: "expired",
          expiresAt: "2026-10-24T12:00:00Z"
        })
      ]
    };
    expect(visibleAnnouncements(state, now).map((item) => item.id)).toEqual(["notice", "ended"]);
  });

  it.each([-1, 0, 1])("hides only the banner at estimated-end offset %i ms for fresh and offline feeds", (offset) => {
    const notice = item({ endsAt: "2026-10-24T12:00:00Z" });

    for (const offline of [false, true]) {
      const state = normalizeAnnouncements({
        ...emptyAnnouncements(),
        items: [notice],
        offline
      });
      expect(visibleAnnouncements(state, now + offset)).toEqual([notice]);
      expect(pinnedAnnouncement(state, now + offset)).toEqual(offset < 0 ? notice : null);
      expect(state.items[0].pinned).toBe(true);
      expect(estimatedMinutes(notice, now + offset)).toBe(offset < 0 ? 1 : null);
    }
  });
  it("ignores legacy persisted dismissals, including maintenance, without losing read history", () => {
    const notice = item({ kind: "maintenance" });
    const state = normalizeAnnouncements({
      ...emptyAnnouncements(),
      items: [notice],
      dismissed: [announcementRevision(notice)],
      read: [announcementRevision(notice)]
    });
    expect(pinnedAnnouncement(state, now)).toEqual(notice);
    expect(visibleAnnouncements(state, now)).toHaveLength(1);
    expect(state.read).toEqual([announcementRevision(notice)]);
    expect("dismissed" in state).toBe(false);
    expect(
      pinnedAnnouncement(
        {
          ...state,
          items: [item({ updatedAt: "2026-10-24T11:30:00Z" })]
        },
        now
      )
    ).not.toBeNull();
  });
  it("prioritizes severe pinned warnings without changing the API severity data", () => {
    const warning = item({
      id: "warning",
      kind: "warning",
      severity: 3
    });
    const state = {
      ...emptyAnnouncements(),
      items: [
        item({ kind: "maintenance" }),
        warning
      ]
    };
    expect(pinnedAnnouncement(state, now)?.id).toBe("warning");
    expect(pinnedAnnouncement(state, now)?.severity).toBe(3);
  });
  it("counts estimated minutes upward without promising completion", () => {
    expect(estimatedMinutes(item({ endsAt: "2026-10-24T12:01:01Z" }), now)).toBe(2);
    expect(estimatedMinutes(item(), now)).toBeNull();
  });
  it("validates cached public DTOs and bounds read history", () => {
    expect(
      normalizeAnnouncements({
        items: [{ id: "bad" }]
      })
    ).toEqual(emptyAnnouncements());
    const state = normalizeAnnouncements({
      ...emptyAnnouncements(),
      items: [item()],
      read: Array.from({ length: 600 }, (_, index) => `notice-${index}`),
      fetchedAt: Infinity
    });
    expect(state.items).toHaveLength(1);
    expect(state.read).toHaveLength(500);
    expect(state.fetchedAt).toBeNull();
  });
  it("selects sparse translations deterministically", () => {
    const notice = item();
    expect(selectAnnouncementTranslation(notice, "ja")?.title).toBe("Information");
  });
});
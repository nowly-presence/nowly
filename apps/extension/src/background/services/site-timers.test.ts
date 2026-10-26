import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTabPresence, upsertTabPresence, type TabPresenceEntry } from "@/background/services/background-context";
import { applySiteTimer, clearSiteTimers } from "@/background/services/site-timers";
import { installChromeMock } from "@/test/chrome-mock";
import type { PresencePayload } from "@/shared/types";

const NOW = 1_800_000_000;
const SECOND_MS = 1000;

const entry = (slug = "twitch", presence: PresencePayload = {}): TabPresenceEntry => ({
  slug,
  presence,
  updatedAt: Date.now()
});

describe("site timers", () => {
  beforeEach(() => {
    installChromeMock();
    vi.useFakeTimers();
    vi.setSystemTime(NOW * SECOND_MS);
  });

  afterEach(() => vi.useRealTimers());

  it("initializes, stabilizes, and isolates site timers across tabs and presences", async () => {
    // 1. Does not add timestamps when disabled
    const activity = entry();
    expect(await applySiteTimer(activity, false)).toBe(activity.presence);
    expect((await chrome.storage.session.get("siteTimers")).siteTimers).toBeUndefined();

    // 2. Adds stable start for activities without timestamps and keeps it over time
    expect((await applySiteTimer(entry("github"), true)).startTime).toBe(NOW);
    vi.advanceTimersByTime(60 * SECOND_MS);
    expect((await applySiteTimer(entry("github"), true)).startTime).toBe(NOW);

    // 3. Keeps first supplied start despite metadata refreshes
    expect(
      (
        await applySiteTimer(
          entry("twitch", { startTime: NOW - 600, details: "First title" }),
          true
        )
      ).startTime
    ).toBe(NOW - 600);
    vi.advanceTimersByTime(60 * SECOND_MS);
    expect(
      (
        await applySiteTimer(
          entry("twitch", { startTime: NOW + 60, details: "New title", state: "New channel" }),
          true
        )
      ).startTime
    ).toBe(NOW - 600);

    // 4. Keeps separate clocks per presence and reuses clock on return
    expect((await applySiteTimer(entry("github"), true)).startTime).toBe(NOW);
  });

  it("handles concurrent updates and survives service worker reload", async () => {
    const results = await Promise.all([
      applySiteTimer(entry("twitch", { startTime: NOW - 100 }), true),
      applySiteTimer(entry("twitch", { startTime: NOW - 50 }), true),
      applySiteTimer(entry("github"), true)
    ]);
    expect(results.map((result) => result.startTime)).toEqual([NOW - 100, NOW - 100, NOW]);
    expect((await chrome.storage.session.get("siteTimers")).siteTimers).toEqual({
      twitch: NOW - 100,
      github: NOW
    });

    vi.advanceTimersByTime(60 * SECOND_MS);
    vi.resetModules();
    const reloaded = await import("@/background/services/site-timers");
    expect((await reloaded.applySiteTimer(entry("twitch"), true)).startTime).toBe(NOW - 100);

    // Resets on new session
    installChromeMock();
    expect((await reloaded.applySiteTimer(entry("twitch"), true)).startTime).toBe(NOW + 60);
  });

  it("clears saved starts without changing the original tab payload", async () => {
    const activity = entry();
    await applySiteTimer(activity, true);
    await clearSiteTimers();
    vi.advanceTimersByTime(60 * SECOND_MS);
    expect(await applySiteTimer(activity, false)).toEqual({});
    expect((await applySiteTimer(activity, true)).startTime).toBe(NOW + 60);
  });

  it("does not replace playback progress, seeks or end-only countdowns", async () => {
    await applySiteTimer(entry("youtube"), true);

    for (const presence of [
      {
        startTime: NOW - 100,
        endTime: NOW + 500
      },
      {
        startTime: NOW - 300,
        endTime: NOW + 300
      },
      { endTime: NOW + 30 },
      { smallImage: "pause" },
      {
        startTime: NOW - 100,
        smallImage: "play"
      }
    ]) {
      expect(await applySiteTimer(entry("youtube", presence), true)).toBe(presence);
    }
  });

  it("remembers paused playback even when the same content omits badges and timestamps", async () => {
    const content = {
      details: "Video",
      buttons: [
        {
          label: "Watch",
          url: "https://video.example/1"
        }
      ]
    };
    await upsertTabPresence(
      1,
      entry("youtube", {
        ...content,
        startTime: NOW - 100,
        endTime: NOW + 500
      })
    );
    await upsertTabPresence(
      1,
      entry("youtube", {
        ...content,
        details: "Paused video"
      })
    );
    const paused = await getTabPresence(1);
    expect(paused?.mediaPlayback).toBe(true);
    expect(await applySiteTimer(paused ?? entry(), true)).toEqual({
      ...content,
      details: "Paused video"
    });
  });

  it("uses metadata to recognize paused playback without buttons", async () => {
    await upsertTabPresence(
      1,
      entry("spotify", {
        name: "Spotify",
        details: "Track",
        state: "Artist",
        startTime: NOW - 100,
        endTime: NOW + 100
      })
    );
    await upsertTabPresence(
      1,
      entry("spotify", {
        name: "Spotify",
        details: "Track",
        state: "Artist"
      })
    );
    expect((await getTabPresence(1))?.mediaPlayback).toBe(true);
  });

  it("does not carry media classification to another content, site or tab", async () => {
    await upsertTabPresence(
      1,
      entry("twitch", {
        endTime: NOW + 100,
        buttons: [
          {
            label: "Watch",
            url: "https://twitch.tv/videos/1"
          }
        ]
      })
    );
    await upsertTabPresence(
      1,
      entry("twitch", {
        buttons: [
          {
            label: "Watch",
            url: "https://twitch.tv/channel"
          }
        ]
      })
    );
    expect((await getTabPresence(1))?.mediaPlayback).toBe(false);
    await upsertTabPresence(2, entry("twitch", { details: "Live" }));
    expect((await getTabPresence(2))?.mediaPlayback).toBe(false);
    await upsertTabPresence(1, entry("spotify", { smallImage: "pause" }));
    await upsertTabPresence(1, entry("github", { details: "Browsing" }));
    expect((await getTabPresence(1))?.mediaPlayback).toBe(false);
  });

  it("ignores invalid cached or future timestamps", async () => {
    await chrome.storage.session.set({
      siteTimers: {
        twitch: "invalid",
        github: NOW + 500
      }
    });
    expect((await applySiteTimer(entry(), true)).startTime).toBe(NOW);
    expect((await applySiteTimer(entry("github", { startTime: NOW + 100 }), true)).startTime).toBe(NOW);
  });

  it("releases the write lock after storage failure", async () => {
    vi.spyOn(chrome.storage.session, "set").mockRejectedValueOnce(new Error("Storage unavailable"));
    await expect(applySiteTimer(entry(), true)).rejects.toThrow("Storage unavailable");
    expect((await applySiteTimer(entry(), true)).startTime).toBe(NOW);
  });
});
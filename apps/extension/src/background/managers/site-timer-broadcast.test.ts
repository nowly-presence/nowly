import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CURRENT_LEGAL_MANIFEST } from "@nowly/shared/legal";
import { broadcastActiveTab } from "@/background/managers/activity-manager";
import { updateSettings } from "@/background/managers/settings-manager";
import { getTabPresence, setFocusedTabId, upsertTabPresence } from "@/background/services/background-context";
import { postNative } from "@/background/services/native";
import { acceptLegalDocuments } from "@/background/services/legal-documents";
import { setCustomActivities } from "@/background/storage/custom-activities.store";
import { STORAGE_KEYS } from "@/background/storage/keys";
import { getCurrentActivity } from "@/background/storage/presences.store";
import { DEFAULT_SETTINGS, setSettings } from "@/background/storage/settings.store";
import { installChromeMock } from "@/test/chrome-mock";
import { emptyCustomActivityDraft } from "@/shared/custom-activity";

vi.mock("@/background/services/native", () => ({ postNative: vi.fn() }));
vi.mock("@/background/storage/support.store", () => ({ recordUsageDay: vi.fn(async () => {}) }));
vi.mock("@/background/services/device-sync", () => ({ syncDeviceState: vi.fn() }));
vi.mock("@/background/analytics-client", () => ({ trackAnalytics: vi.fn() }));
vi.mock("@/background/runtime-logs", () => ({ addRuntimeLog: vi.fn() }));

const NOW = 1_800_000_000;
const SECOND_MS = 1000;

describe("site timer broadcasts", () => {
  beforeEach(async () => {
    installChromeMock();
    vi.stubGlobal("chrome", {
      ...globalThis.chrome,
      action: {
        setBadgeText: vi.fn(async () => {}),
        setBadgeBackgroundColor: vi.fn(async () => {})
      }
    });
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW * SECOND_MS);
    await acceptLegalDocuments({
      versions: {
        tos: CURRENT_LEGAL_MANIFEST.documents.tos.version,
        privacy: CURRENT_LEGAL_MANIFEST.documents.privacy.version
      },
      acceptTos: true,
      acknowledgePrivacy: true
    });
    setFocusedTabId(1);
    await setSettings({
      ...DEFAULT_SETTINGS,
      preserveSiteTimer: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("broadcasts the same start on another site's tab and back, and in another tab of the same site", async () => {
    await upsertTabPresence(1, {
      slug: "twitch",
      presence: { name: "Twitch" },
      updatedAt: Date.now()
    });
    await broadcastActiveTab();
    expect(postNative).toHaveBeenLastCalledWith({
      type: "SET_ACTIVITY",
      presence: {
        name: "Twitch",
        startTime: NOW
      }
    });

    vi.advanceTimersByTime(60 * SECOND_MS);
    await upsertTabPresence(2, {
      slug: "github",
      presence: { name: "GitHub" },
      updatedAt: Date.now()
    });
    setFocusedTabId(2);
    await broadcastActiveTab();
    expect(postNative).toHaveBeenLastCalledWith({
      type: "SET_ACTIVITY",
      presence: {
        name: "GitHub",
        startTime: NOW + 60
      }
    });

    vi.advanceTimersByTime(60 * SECOND_MS);
    setFocusedTabId(1);
    await broadcastActiveTab();
    expect((await getCurrentActivity())?.presence.startTime).toBe(NOW);

    await upsertTabPresence(3, {
      slug: "twitch",
      presence: {
        name: "Another channel",
        startTime: NOW + 120
      },
      updatedAt: Date.now()
    });
    setFocusedTabId(3);
    await broadcastActiveTab();
    expect(postNative).toHaveBeenLastCalledWith({
      type: "SET_ACTIVITY",
      presence: {
        name: "Another channel",
        startTime: NOW
      }
    });
    expect((await getTabPresence(3))?.presence.startTime).toBe(NOW + 120);
  });

  it("uses the selected site in priority mode too", async () => {
    await upsertTabPresence(1, {
      slug: "github",
      presence: {},
      updatedAt: Date.now()
    });
    await upsertTabPresence(2, {
      slug: "twitch",
      presence: {},
      updatedAt: Date.now()
    });
    await updateSettings({
      activitySelectionMode: "priority",
      activityPriorityOrder: ["twitch", "github"]
    });
    expect(await getCurrentActivity()).toMatchObject({
      slug: "twitch",
      presence: { startTime: NOW }
    });
  });

  it("restores raw timestamps immediately on disabling and starts a fresh cache on re-enabling", async () => {
    await upsertTabPresence(1, {
      slug: "twitch",
      presence: {},
      updatedAt: Date.now()
    });
    await broadcastActiveTab();
    expect((await getCurrentActivity())?.presence.startTime).toBe(NOW);

    vi.advanceTimersByTime(60 * SECOND_MS);
    await updateSettings({ preserveSiteTimer: false });
    expect(postNative).toHaveBeenLastCalledWith({
      type: "SET_ACTIVITY",
      presence: {}
    });
    expect((await chrome.storage.session.get("siteTimers")).siteTimers).toEqual({});

    await updateSettings({ preserveSiteTimer: true });
    expect((await getCurrentActivity())?.presence.startTime).toBe(NOW + 60);
  });

  it("keeps original supplied timestamps available after disabling", async () => {
    await upsertTabPresence(1, {
      slug: "github",
      presence: { startTime: NOW - 600 },
      updatedAt: Date.now()
    });
    await broadcastActiveTab();
    await upsertTabPresence(1, {
      slug: "github",
      presence: { startTime: NOW },
      updatedAt: Date.now()
    });
    await broadcastActiveTab();
    expect((await getCurrentActivity())?.presence.startTime).toBe(NOW - 600);
    await updateSettings({ preserveSiteTimer: false });
    expect((await getCurrentActivity())?.presence.startTime).toBe(NOW);
  });

  it("keeps the 2.4.0 legal gate ahead of site timer broadcasts", async () => {
    await chrome.storage.local.set({ [STORAGE_KEYS.legal]: null });
    await upsertTabPresence(1, {
      slug: "twitch",
      presence: {},
      updatedAt: Date.now()
    });
    await broadcastActiveTab();
    expect(postNative).toHaveBeenLastCalledWith({ type: "CLEAR_ACTIVITY" });
    expect(await getCurrentActivity()).toBeNull();
    expect((await chrome.storage.session.get("siteTimers")).siteTimers).toBeUndefined();
  });

  it("leaves 2.4.0 custom activity priority and timestamps unchanged", async () => {
    const activity = {
      ...emptyCustomActivityDraft(),
      id: "focus",
      name: "Focus",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await setCustomActivities({
      items: [activity],
      activeId: activity.id,
      activatedAt: Date.now()
    });
    await upsertTabPresence(1, {
      slug: "twitch",
      presence: {},
      updatedAt: Date.now()
    });
    await broadcastActiveTab();
    expect(await getCurrentActivity()).toMatchObject({
      slug: "custom:focus",
      presence: {
        name: "Focus",
        startTime: NOW
      }
    });
    expect((await chrome.storage.session.get("siteTimers")).siteTimers).toBeUndefined();
    vi.advanceTimersByTime(60 * SECOND_MS);
    await updateSettings({ preserveSiteTimer: false });
    expect(await getCurrentActivity()).toMatchObject({
      slug: "custom:focus",
      presence: { startTime: NOW }
    });
  });

  it("never injects elapsed time into a paused media activity", async () => {
    const video = {
      name: "YouTube",
      details: "Video",
      startTime: NOW - 100,
      endTime: NOW + 100
    };
    await upsertTabPresence(1, {
      slug: "youtube",
      presence: video,
      updatedAt: Date.now()
    });
    await broadcastActiveTab();
    expect(postNative).toHaveBeenLastCalledWith({
      type: "SET_ACTIVITY",
      presence: video
    });
    await upsertTabPresence(1, {
      slug: "youtube",
      presence: {
        name: "YouTube",
        details: "Video"
      },
      updatedAt: Date.now()
    });
    await broadcastActiveTab();
    expect(postNative).toHaveBeenLastCalledWith({
      type: "SET_ACTIVITY",
      presence: {
        name: "YouTube",
        details: "Video"
      }
    });
  });
});
import { beforeEach, describe, expect, it, vi } from "vitest";

const presences = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));

vi.mock("@/background/storage/presences.store", () => ({
  getPresences: async () => presences.current,
  setDebug: vi.fn()
}));
vi.mock("@/background/managers/activity-manager", () => ({
  handleActivityUpdate: vi.fn(),
  handleClearActivity: vi.fn()
}));

const sender = (url: string | undefined): chrome.runtime.MessageSender => ({
  tab: url
    ? ({
        id: 1,
        url
      } as chrome.tabs.Tab)
    : undefined
});

describe("isPresenceSender", () => {
  beforeEach(() => {
    presences.current = {
      youtube: {
        enabled: true,
        metadata: {
          url: ["stale.example"]
        },
        release: {
          metadata: {
            url: ["youtube.com"]
          }
        }
      },
      local: {
        enabled: true,
        metadata: {
          url: ["https://local.example/app/*"]
        }
      }
    };
  });

  it("accepts a tab on a site the presence declares", async () => {
    const { isPresenceSender } = await import("@/background/runtime/presence-runtime-bridge");

    expect(await isPresenceSender("youtube", sender("https://www.youtube.com/watch?v=1"))).toBe(true);
    expect(await isPresenceSender("local", sender("https://local.example/app/page"))).toBe(true);
  });

  it("refuses a tab on any other site, an unknown slug and a sender without URL", async () => {
    const { isPresenceSender } = await import("@/background/runtime/presence-runtime-bridge");

    expect(await isPresenceSender("youtube", sender("https://evil.example/"))).toBe(false);
    expect(await isPresenceSender("youtube", sender("https://stale.example/"))).toBe(false);
    expect(await isPresenceSender("youtube", sender("https://youtube.com.evil.example/"))).toBe(false);
    expect(await isPresenceSender("missing", sender("https://www.youtube.com/"))).toBe(false);
    expect(await isPresenceSender("youtube", sender(undefined))).toBe(false);
  });
});
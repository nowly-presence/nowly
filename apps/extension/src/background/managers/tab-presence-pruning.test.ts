import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearTabPresences, getTabPresencesSnapshot, upsertTabPresence } from "@/background/services/background-context";
import { installChromeMock } from "@/test/chrome-mock";

const CHATGPT_TAB_ID = 7;
const OTHER_TAB_ID = 9;

const entry = (slug: string) => ({
  slug,
  presence: { name: slug },
  updatedAt: 1000
});

vi.mock("@/background/managers/activity-manager", () => ({
  handleRemovedTab: vi.fn(async (tabId: number) => {
    const { removeTabPresence } = await import("@/background/services/background-context");
    await removeTabPresence(tabId);
  })
}));

vi.mock("@/background/storage/presences.store", () => ({
  getPresences: async () => ({
    chatgpt: {
      metadata: {
        url: ["chatgpt.com"]
      }
    }
  })
}));

const mockTabs = (tabs: {
  id: number;
  url?: string;
}[]): void => {
  Object.assign(
    (
      globalThis as {
        chrome: object;
      }
    ).chrome,
    {
      tabs: {
        query: async () => tabs
      }
    }
  );
};

describe("pruneStaleTabPresences", () => {
  beforeEach(async () => {
    installChromeMock();
    await clearTabPresences();
  });

  it("drops entries whose tab no longer exists", async () => {
    const { pruneStaleTabPresences } = await import("@/background/managers/tab-presence-pruning");
    await upsertTabPresence(CHATGPT_TAB_ID, entry("chatgpt"));
    mockTabs([]);

    await pruneStaleTabPresences();

    expect(await getTabPresencesSnapshot()).toEqual([]);
  });

  it("drops entries whose tab navigated away from the presence site", async () => {
    const { pruneStaleTabPresences } = await import("@/background/managers/tab-presence-pruning");
    await upsertTabPresence(CHATGPT_TAB_ID, entry("chatgpt"));
    mockTabs([
      {
        id: CHATGPT_TAB_ID,
        url: "chrome-extension://abc/page.html"
      }
    ]);

    await pruneStaleTabPresences();

    expect(await getTabPresencesSnapshot()).toEqual([]);
  });

  it("keeps entries whose tab is still on the presence site", async () => {
    const { pruneStaleTabPresences } = await import("@/background/managers/tab-presence-pruning");
    await upsertTabPresence(CHATGPT_TAB_ID, entry("chatgpt"));
    await upsertTabPresence(OTHER_TAB_ID, entry("chatgpt"));
    mockTabs([
      {
        id: CHATGPT_TAB_ID,
        url: "https://chatgpt.com/c/1"
      },
      { id: OTHER_TAB_ID }
    ]);

    await pruneStaleTabPresences();

    expect((await getTabPresencesSnapshot()).map((item) => item.tabId).sort()).toEqual([CHATGPT_TAB_ID, OTHER_TAB_ID]);
  });
});
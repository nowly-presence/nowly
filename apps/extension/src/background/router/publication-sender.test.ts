import { describe, expect, it, vi } from "vitest";
import { registerHandlers, registerRouter, type HandlerRegistry } from "@/background/router/router";

vi.mock("@/background/services/api-state", () => ({
  getEffectiveWebUrl: () => "https://nowly.me"
}));
vi.mock("@/background/services/custom-activity-editors", () => ({ registerCustomActivityEditors: vi.fn() }));

describe("publication background sender allowlist", () => {
  it("checks the actual sender URL and never allows website publisher or storage access", async () => {
    const addListener = vi.fn();
    vi.stubGlobal("chrome", {
      runtime: {
        onMessage: { addListener },
        getURL: () => "chrome-extension://extension-id/"
      }
    });
    const status = vi.fn(async () => ({ ok: true }));
    registerHandlers({ GET_ACTIVITY_PUBLICATION_STATUS: status } as unknown as HandlerRegistry);
    registerRouter();
    const listener = addListener.mock.calls[0][0];
    const message = {
      source: "PRESENCES_CONTENT",
      type: "GET_ACTIVITY_PUBLICATION_STATUS",
      payload: {}
    };
    const respond = vi.fn();

    for (const url of [undefined, "https://evil.example", "https://nowly.me.evil.example", "https://nowly.me@evil.example"]) {
      expect(listener(message, { url }, respond)).toBe(false);
    }

    expect(
      listener(
        {
          ...message,
          type: "SAVE_CUSTOM_ACTIVITY"
        },
        { url: "https://nowly.me/activities/id" },
        respond
      )
    ).toBe(false);
    expect(
      listener(
        {
          ...message,
          source: "PRESENCES_POPUP"
        },
        { url: "https://nowly.me/activities/id" },
        respond
      )
    ).toBe(false);
    expect(status).not.toHaveBeenCalled();
    expect(listener(message, { url: "https://nowly.me/activities/id" }, respond)).toBe(true);
    await Promise.resolve();
    expect(status).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
import { describe, expect, it, vi } from "vitest";
import { registerRouter, type HandlerRegistry } from "@/background/router/router";

vi.mock("@/background/services/api-state", () => ({
  getEffectiveWebUrl: () => "https://nowly.me"
}));

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
    registerRouter({ GET_ACTIVITY_PUBLICATION_STATUS: status } as unknown as HandlerRegistry);
    const listener = addListener.mock.calls[0][0];
    const message = {
      source: "PRESENCES_CONTENT",
      type: "GET_ACTIVITY_PUBLICATION_STATUS",
      payload: {}
    };
    let markResponded = () => {};
    const responded = new Promise<void>((resolve) => {
      markResponded = resolve;
    });
    const respond = vi.fn(() => markResponded());

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
    expect(
      listener(
        {
          ...message,
          source: "PRESENCES_POPUP",
          type: "constructor"
        },
        { url: "chrome-extension://extension-id/sidepanel.html" },
        respond
      )
    ).toBe(false);
    expect(status).not.toHaveBeenCalled();
    expect(listener(message, { url: "https://nowly.me/activities/id" }, respond)).toBe(true);
    await responded;
    expect(status).toHaveBeenCalledOnce();
    expect(respond).toHaveBeenCalledExactlyOnceWith({ ok: true });
    vi.unstubAllGlobals();
  });
});
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/content/web-season", () => ({ startWebSeason: vi.fn() }));

describe("public activity content protocol", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it("forwards only exact-origin same-window publication requests", async () => {
    vi.useFakeTimers();
    let markPosted = () => {};
    const posted = new Promise<void>((resolve) => {
      markPosted = resolve;
    });
    const target = Object.assign(new EventTarget(), {
      location: { origin: "https://nowly.me" },
      postMessage: vi.fn(() => markPosted()),
      setInterval,
      clearInterval
    });
    const send = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("window", target);
    vi.stubGlobal("chrome", {
      storage: {
        onChanged: { addListener: vi.fn() }
      },
      runtime: {
        sendMessage: send,
        onMessage: { addListener: vi.fn() }
      }
    });
    await import("@/content/index");
    const receive = (origin: string, source: unknown) => {
      const event = new MessageEvent("message", {
        origin,
        data: {
          source: "Nowly",
          type: "GET_ACTIVITY_PUBLICATION_STATUS",
          messageId: "review",
          payload: { id: "a".repeat(32) }
        }
      });
      Object.defineProperty(event, "source", { value: source });
      target.dispatchEvent(event);
    };
    receive("https://evil.example", target);
    receive("https://nowly.me", {});
    expect(send).not.toHaveBeenCalled();
    receive("https://nowly.me", target);
    await posted;
    expect(send).toHaveBeenCalledExactlyOnceWith({
      source: "PRESENCES_CONTENT",
      type: "GET_ACTIVITY_PUBLICATION_STATUS",
      payload: { id: "a".repeat(32) }
    });
    expect(target.postMessage).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        source: "Nowly",
        type: "GET_ACTIVITY_PUBLICATION_STATUS_RESULT",
        payload: { ok: true },
        messageId: "review"
      }),
      "https://nowly.me"
    );
  });
});
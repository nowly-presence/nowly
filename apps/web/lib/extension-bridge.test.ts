import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("extension bridge window boundary", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it("ignores foreign windows and origins and targets the exact page origin", async () => {
    const target = Object.assign(new EventTarget(), {
      location: { origin: "https://nowly.me" },
      postMessage: vi.fn(),
      setInterval,
      clearInterval,
      setTimeout,
      clearTimeout
    });
    vi.stubGlobal("window", target);
    const { requestExtension, subscribeExtensionDetected } = await import("./extension-bridge");

    const detected = vi.fn();
    subscribeExtensionDetected(detected);
    const receive = (origin: string, source: unknown, type: string, messageId?: string) => {
      const event = new MessageEvent("message", {
        origin,
        data: {
          source: "Nowly",
          type,
          messageId,
          payload: { ok: true }
        }
      });
      Object.defineProperty(event, "source", { value: source });
      target.dispatchEvent(event);
    };
    receive("https://evil.example", target, "EXT_DETECTED");
    receive(target.location.origin, {}, "EXT_DETECTED");
    expect(detected).not.toHaveBeenCalled();
    receive(target.location.origin, target, "EXT_DETECTED");
    expect(detected).toHaveBeenCalledWith(true);
    const request = requestExtension("GET_ACTIVITY_PUBLICATION_STATUS", { id: "a".repeat(32) });
    const sent = target.postMessage.mock.calls.at(-1);
    expect(sent?.[1]).toBe(target.location.origin);
    const resolved = vi.fn();
    void request.then(resolved);
    receive("https://evil.example", target, "GET_ACTIVITY_PUBLICATION_STATUS_RESULT", sent?.[0].messageId);
    receive(target.location.origin, {}, "GET_ACTIVITY_PUBLICATION_STATUS_RESULT", sent?.[0].messageId);
    await Promise.resolve();
    expect(resolved).not.toHaveBeenCalled();
    receive(target.location.origin, target, "GET_ACTIVITY_PUBLICATION_STATUS_RESULT", sent?.[0].messageId);
    await expect(request).resolves.toEqual({ ok: true });
  });
});
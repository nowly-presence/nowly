import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAnnouncementUpdates } from "@/shared/announcements-live";

describe("panel announcement connection lifetime", () => {
  const streams: {
    close: ReturnType<typeof vi.fn>;
    invalidate: () => void;
  }[] = [];
  let visibility = "visible";
  let documentEvents: EventTarget;
  let windowEvents: EventTarget;
  beforeEach(() => {
    vi.useFakeTimers();
    visibility = "visible";
    streams.length = 0;
    documentEvents = new EventTarget();
    windowEvents = new EventTarget();
    vi.stubGlobal("document", {
      get visibilityState() {
        return visibility;
      },
      addEventListener: documentEvents.addEventListener.bind(documentEvents),
      removeEventListener: documentEvents.removeEventListener.bind(documentEvents)
    });
    vi.stubGlobal("window", {
      setInterval,
      clearInterval,
      addEventListener: windowEvents.addEventListener.bind(windowEvents),
      removeEventListener: windowEvents.removeEventListener.bind(windowEvents)
    });
    vi.stubGlobal(
      "EventSource",
      class {
        close = vi.fn();
        addEventListener = (_type: string, listener: () => void) => {
          streams[streams.length - 1].invalidate = listener;
        };
        constructor() {
          streams.push({
            close: this.close,
            invalidate: () => {}
          });
        }
      }
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it("refreshes on invalidation, polls without SSE, and closes streams and timers when hidden or unmounted", async () => {
    const refresh = vi.fn(async () => {});
    const stop = startAnnouncementUpdates("https://api.example.com", refresh);
    await vi.advanceTimersByTimeAsync(0);
    expect(streams).toHaveLength(1);
    streams[0].invalidate();
    await vi.advanceTimersByTimeAsync(0);
    expect(refresh).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(refresh).toHaveBeenCalledTimes(3);
    visibility = "hidden";
    documentEvents.dispatchEvent(new Event("visibilitychange"));
    expect(streams[0].close).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(refresh).toHaveBeenCalledTimes(3);
    visibility = "visible";
    documentEvents.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
    expect(streams).toHaveLength(2);
    expect(refresh).toHaveBeenCalledTimes(4);
    stop();
    expect(streams[1].close).toHaveBeenCalledTimes(1);
    windowEvents.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(refresh).toHaveBeenCalledTimes(4);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("continues fetching when EventSource is unavailable and rejects unsafe stream protocols", async () => {
    vi.stubGlobal("EventSource", undefined);
    const refresh = vi.fn(async () => {});
    const stop = startAnnouncementUpdates("https://api.example.com", refresh);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(refresh).toHaveBeenCalledTimes(2);
    stop();
    expect(streams).toHaveLength(0);
  });
  it("coalesces burst invalidations instead of building an unbounded fetch queue", async () => {
    let release: (() => void) | undefined;
    const refresh = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );
    const stop = startAnnouncementUpdates("https://api.example.com", refresh);

    for (let count = 0; count < 100; count++) streams[0].invalidate();

    expect(refresh).toHaveBeenCalledTimes(1);
    release?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(refresh).toHaveBeenCalledTimes(2);
    stop();
    release?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
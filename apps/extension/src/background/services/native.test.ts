import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NativeResponse, PresencePayload } from "@/shared/types/native";

vi.mock("@/background/storage/discord-ipc-issue.store", () => ({
  getDiscordIpcIssue: async () => ({
    active: false,
    prompted: false
  }),
  setDiscordIpcIssue: async () => undefined
}));
vi.mock("@/background/storage/onboarding.store", () => ({
  setNativeProfile: vi.fn(),
  setNativeSeenConnectedOnce: vi.fn()
}));
vi.mock("@/background/services/host-updates", () => ({
  getHostUpdateVersion: () => undefined,
  refreshHostUpdate: async () => undefined
}));

const mockPort = () => {
  const onMessage = vi.fn<(listener: (message: NativeResponse) => Promise<void>) => void>();
  const onDisconnect = vi.fn<(listener: () => void) => void>();
  return {
    onMessage: { addListener: onMessage },
    onDisconnect: { addListener: onDisconnect },
    postMessage: vi.fn(),
    disconnect: vi.fn(),
    receive: (message: NativeResponse) => onMessage.mock.calls[0]?.[0](message),
    drop: () => onDisconnect.mock.calls[0]?.[0]()
  };
};

const pong: NativeResponse = {
  type: "PONG",
  connected: true,
  discordConnected: true,
  status: "discord connected",
  version: "1.0.0"
};

describe("native host connection", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns Discord status from the host response after reconnecting", async () => {
    const port = mockPort();
    vi.stubGlobal("chrome", {
      runtime: {
        connectNative: () => port
      }
    });
    const { reconnectNative } = await import("./native");

    const reconnect = reconnectNative();
    const received = vi.fn();
    void reconnect.then(received);

    expect(port.postMessage).toHaveBeenCalledWith({ type: "PING" });
    await port.receive({
      type: "CONNECTED",
      version: "1.0.0"
    });
    expect(received).not.toHaveBeenCalled();

    await port.receive(pong);
    await expect(reconnect).resolves.toMatchObject({
      connected: true,
      discordConnected: true,
      version: "1.0.0"
    });
  });

  it("ignores events from a retired port and clears the connection after a post failure", async () => {
    const oldPort = mockPort();
    const port = mockPort();
    vi.stubGlobal("chrome", {
      runtime: { connectNative: vi.fn().mockReturnValueOnce(oldPort).mockReturnValueOnce(port) }
    });
    const { getNativeStatus, postNative, reconnectNative, restartNative } = await import("./native");

    const initial = reconnectNative();
    await oldPort.receive(pong);
    await initial;

    const restart = restartNative();
    oldPort.drop();
    await oldPort.receive({
      ...pong,
      version: "0.9.0"
    });
    expect(getNativeStatus()).toMatchObject({
      connected: false,
      discordConnected: false,
      version: undefined
    });
    await port.receive(pong);
    await expect(restart).resolves.toMatchObject({
      connected: true,
      discordConnected: true,
      version: "1.0.0"
    });

    port.postMessage.mockImplementationOnce(() => {
      throw new Error("port closed");
    });
    expect(postNative({ type: "PING" })).toBe(false);
    expect(getNativeStatus()).toMatchObject({
      connected: false,
      discordConnected: false,
      version: undefined,
      status: "port closed"
    });
  });

  it("settles when the host disconnects or fails to respond", async () => {
    vi.useFakeTimers();
    const port = mockPort();
    const stalledPort = mockPort();
    vi.stubGlobal("chrome", {
      runtime: { connectNative: vi.fn().mockReturnValueOnce(port).mockReturnValueOnce(stalledPort) }
    });
    const { reconnectNative } = await import("./native");

    const disconnected = reconnectNative();
    port.drop();
    await expect(disconnected).resolves.toMatchObject({
      connected: false,
      status: "native disconnected"
    });

    const stalled = reconnectNative();
    await vi.runAllTimersAsync();
    await expect(stalled).resolves.toMatchObject({
      connected: false,
      status: "connecting"
    });
  });
});

describe("repeated activities", () => {
  const presence = {
    details: "Track",
    startTime: 1000,
    endTime: 1200
  };
  const setActivity = (changes: Partial<PresencePayload> = {}) => ({
    type: "SET_ACTIVITY" as const,
    presence: { ...presence, ...changes }
  });

  const connect = async () => {
    const port = mockPort();
    const nextPort = mockPort();
    vi.stubGlobal("chrome", {
      runtime: { connectNative: vi.fn().mockReturnValueOnce(port).mockReturnValueOnce(nextPort) }
    });
    const native = await import("./native");

    const sent = (target = port) => target.postMessage.mock.calls.filter(([message]) => message.type === "SET_ACTIVITY").length;
    return { ...native, port, nextPort, sent };
  };

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("drops an identical activity, even with jittering timestamps", async () => {
    const { postNative, sent } = await connect();

    expect(postNative(setActivity())).toBe(true);
    expect(postNative(setActivity())).toBe(true);
    expect(
      postNative(
        setActivity({
          startTime: 1001,
          endTime: 1199
        })
      )
    ).toBe(true);

    expect(sent()).toBe(1);
  });

  it("sends a new track and a seek", async () => {
    const { postNative, sent } = await connect();

    postNative(setActivity());
    postNative(setActivity({ details: "Next track" }));
    postNative(
      setActivity({
        details: "Next track",
        startTime: 970,
        endTime: 1170
      })
    );
    postNative(
      setActivity({
        details: "Next track",
        startTime: undefined,
        endTime: undefined
      })
    );

    expect(sent()).toBe(4);
  });

  it("refreshes an unchanged activity so a restarted Discord gets it back", async () => {
    const { postNative, sent } = await connect();

    postNative(setActivity());
    vi.advanceTimersByTime(14_999);
    postNative(setActivity());
    expect(sent()).toBe(1);

    vi.advanceTimersByTime(1);
    postNative(setActivity());
    expect(sent()).toBe(2);
  });

  it("sends the same activity again after a clear or a host error", async () => {
    const { postNative, port, sent } = await connect();

    postNative(setActivity());
    postNative({ type: "CLEAR_ACTIVITY" });
    postNative(setActivity());
    expect(sent()).toBe(2);

    await port.receive({
      type: "ERROR",
      error: "discord ipc read timed out"
    });
    postNative(setActivity());
    expect(sent()).toBe(3);
  });

  it("sends the same activity again on a new port", async () => {
    const { postNative, port, nextPort, sent } = await connect();

    postNative(setActivity());
    port.drop();
    postNative(setActivity());

    expect(sent(nextPort)).toBe(1);
  });
});
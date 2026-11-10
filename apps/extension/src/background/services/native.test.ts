import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NativeResponse } from "@/shared/types/native";

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
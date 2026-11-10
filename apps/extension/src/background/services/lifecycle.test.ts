import { afterEach, expect, it, vi } from "vitest";
import { registerLifecycleHandlers } from "@/background/services/lifecycle";
import type { NativeResponse } from "@/shared/types/native";

const mocks = vi.hoisted(() => ({
  subscribe: vi.fn<(listener: (message: NativeResponse) => void) => void>(),
  log: vi.fn()
}));

vi.mock("@/background/services/native", () => ({
  onNativeResponse: mocks.subscribe,
  connectNative: vi.fn()
}));
vi.mock("@/background/runtime-logs", () => ({ addRuntimeLog: mocks.log }));

afterEach(() => vi.unstubAllGlobals());

it("logs the first heartbeat and each independent host transition once", () => {
  const event = { addListener: vi.fn() };
  vi.stubGlobal("chrome", {
    alarms: {
      create: vi.fn(),
      onAlarm: event
    },
    runtime: {
      onStartup: event,
      onInstalled: event
    },
    action: { onClicked: event },
    permissions: { onAdded: event },
    storage: { onChanged: event },
    tabs: {
      onRemoved: event,
      onActivated: event,
      onUpdated: event
    },
    windows: { onFocusChanged: event }
  });

  registerLifecycleHandlers();
  expect(mocks.subscribe).toHaveBeenCalledOnce();
  const receive = mocks.subscribe.mock.calls[0][0];
  const first = {
    type: "PONG",
    connected: true,
    status: "discord connected",
    version: "1.4.4"
  } satisfies NativeResponse;
  const disconnected = {
    ...first,
    connected: false
  };
  const nextStatus = {
    ...disconnected,
    status: "waiting"
  };
  const nextVersion = {
    ...nextStatus,
    version: "1.4.5"
  };
  const denied = {
    ...nextVersion,
    code: "DISCORD_IPC_ACCESS_DENIED"
  } satisfies NativeResponse;

  for (const heartbeat of [first, disconnected, nextStatus, nextVersion, denied]) {
    receive(heartbeat);
    receive({ ...heartbeat });
  }

  expect(mocks.log.mock.calls).toEqual([
    [
      "success",
      "native",
      "native heartbeat",
      {
        connected: true,
        status: "discord connected",
        nativeVersion: "1.4.4"
      }
    ],
    [
      "warn",
      "native",
      "native heartbeat",
      {
        connected: false,
        status: "discord connected",
        nativeVersion: "1.4.4"
      }
    ],
    [
      "warn",
      "native",
      "native heartbeat",
      {
        connected: false,
        status: "waiting",
        nativeVersion: "1.4.4"
      }
    ],
    [
      "warn",
      "native",
      "native heartbeat",
      {
        connected: false,
        status: "waiting",
        nativeVersion: "1.4.5"
      }
    ],
    [
      "error",
      "native",
      "native heartbeat",
      {
        connected: false,
        status: "waiting",
        nativeVersion: "1.4.5",
        code: "DISCORD_IPC_ACCESS_DENIED"
      }
    ]
  ]);
});
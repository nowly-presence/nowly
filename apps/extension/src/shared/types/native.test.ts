import { describe, expect, it } from "vitest";
import { isNativeErrorCode, NATIVE_ERROR_CODES, type NativeResponse } from "@/shared/types/native";

const accessDenied = NATIVE_ERROR_CODES.discordIpcAccessDenied;

describe("native error codes", () => {
  it.each<[string, NativeResponse, boolean]>([
    [
      "a heartbeat carrying the code",
      {
        type: "PONG",
        connected: true,
        status: "connected",
        code: accessDenied
      },
      true
    ],
    [
      "an error carrying the code",
      {
        type: "ERROR",
        error: "open \\\\.\\pipe\\discord-ipc-0: Access is denied.",
        code: accessDenied
      },
      true
    ],
    [
      "an error with the same text but no code",
      {
        type: "ERROR",
        error: "open \\\\.\\pipe\\discord-ipc-0: Access is denied."
      },
      false
    ],
    [
      "a heartbeat without a code",
      {
        type: "PONG",
        connected: true,
        status: "connected"
      },
      false
    ]
  ])("detects the Discord IPC access-denied code only from the code field: %s", (_case, response, expected) => {
    expect(isNativeErrorCode(response, accessDenied)).toBe(expected);
  });
});
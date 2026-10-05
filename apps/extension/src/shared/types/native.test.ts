import { describe, expect, it } from "vitest"
import { isNativeErrorCode, NATIVE_ERROR_CODES, type NativeResponse } from "@/shared/types/native"

describe("native error codes", () => {
  it("detects the Discord IPC access-denied code on heartbeat responses", () => {
    const response: NativeResponse = {
      type: "PONG",
      connected: true,
      status: "connected",
      code: NATIVE_ERROR_CODES.discordIpcAccessDenied,
    }

    expect(isNativeErrorCode(response, NATIVE_ERROR_CODES.discordIpcAccessDenied)).toBe(true)
  })

  it("detects the Discord IPC access-denied code on error responses", () => {
    const response: NativeResponse = {
      type: "ERROR",
      error: "open \\\\.\\pipe\\discord-ipc-0: Access is denied.",
      code: NATIVE_ERROR_CODES.discordIpcAccessDenied,
    }

    expect(isNativeErrorCode(response, NATIVE_ERROR_CODES.discordIpcAccessDenied)).toBe(true)
  })

  it("ignores responses with another code", () => {
    const response: NativeResponse = { type: "ERROR", error: "other error" }

    expect(isNativeErrorCode(response, NATIVE_ERROR_CODES.discordIpcAccessDenied)).toBe(false)
  })
})

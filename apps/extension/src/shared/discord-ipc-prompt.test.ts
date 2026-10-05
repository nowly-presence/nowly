import { describe, expect, it } from "vitest"
import {
  discordIpcIssueCode,
  discordIpcIssueOf,
  isDiscordIpcIssue,
  markDiscordIpcIssuePrompted,
  NO_DISCORD_IPC_ISSUE,
  shouldPromptDiscordIpcIssue,
  trackDiscordIpcIssue,
  type DiscordIpcIssue,
} from "@/shared/discord-ipc-prompt"
import { NATIVE_ERROR_CODES, type NativeResponse } from "@/shared/types/native"

const deniedPong: NativeResponse = {
  type: "PONG",
  connected: true,
  status: "connected",
  discordConnected: false,
  code: NATIVE_ERROR_CODES.discordIpcAccessDenied,
}
const deniedError: NativeResponse = {
  type: "ERROR",
  error: "open \\\\.\\pipe\\discord-ipc-0: Access is denied.",
  code: NATIVE_ERROR_CODES.discordIpcAccessDenied,
}
const healthyPong: NativeResponse = { type: "PONG", connected: true, status: "discord connected", discordConnected: true }
const plainError: NativeResponse = { type: "ERROR", error: "open \\\\.\\pipe\\discord-ipc-0: Access is denied." }

const countOpenings = (messages: NativeResponse[], start: DiscordIpcIssue = NO_DISCORD_IPC_ISSUE) => {
  let issue = start
  let openings = 0
  for (const message of messages) {
    issue = trackDiscordIpcIssue(issue, message)
    if (shouldPromptDiscordIpcIssue(issue, false)) {
      openings += 1
      issue = markDiscordIpcIssuePrompted(issue)
    }
  }
  return { issue, openings }
}

describe("Discord IPC prompt", () => {
  it("opens when a PONG carries the code", () => {
    expect(countOpenings([deniedPong]).openings).toBe(1)
  })

  it("opens when an ERROR carries the code", () => {
    expect(countOpenings([deniedError]).openings).toBe(1)
  })

  it("does not open for responses without the code", () => {
    const { issue, openings } = countOpenings([healthyPong, plainError, { type: "OK" }, { type: "CONNECTED", version: "1.4.5" }])
    expect(openings).toBe(0)
    expect(issue).toEqual(NO_DISCORD_IPC_ISSUE)
  })

  it("opens once for consecutive heartbeats with the code", () => {
    const { issue, openings } = countOpenings([deniedPong, deniedPong, deniedError, deniedPong])
    expect(openings).toBe(1)
    expect(issue).toEqual({ active: true, prompted: true })
  })

  it("opens once more after the problem resolves then comes back", () => {
    expect(countOpenings([deniedPong, deniedPong, healthyPong, deniedPong, deniedError]).openings).toBe(2)
  })

  it("keeps the episode on responses that are not heartbeats", () => {
    const { issue, openings } = countOpenings([deniedPong, plainError, { type: "OK" }, deniedPong])
    expect(openings).toBe(1)
    expect(issue.active).toBe(true)
  })

  it("waits while something else is on screen, then opens once", () => {
    const issue = trackDiscordIpcIssue(NO_DISCORD_IPC_ISSUE, deniedPong)
    expect(shouldPromptDiscordIpcIssue(issue, true)).toBe(false)
    expect(shouldPromptDiscordIpcIssue(issue, false)).toBe(true)
    expect(shouldPromptDiscordIpcIssue(markDiscordIpcIssuePrompted(issue), false)).toBe(false)
  })

  it("does not mark an inactive issue as prompted", () => {
    expect(markDiscordIpcIssuePrompted(NO_DISCORD_IPC_ISSUE)).toBe(NO_DISCORD_IPC_ISSUE)
  })

  it("maps the issue to and from the native status", () => {
    const issue = { active: true, prompted: true }
    expect(discordIpcIssueCode(issue)).toBe(NATIVE_ERROR_CODES.discordIpcAccessDenied)
    expect(discordIpcIssueCode(NO_DISCORD_IPC_ISSUE)).toBeUndefined()
    expect(discordIpcIssueOf({ connected: true, status: "connected", code: discordIpcIssueCode(issue), codePrompted: true })).toEqual(issue)
    expect(discordIpcIssueOf({ connected: true, status: "connected" })).toEqual(NO_DISCORD_IPC_ISSUE)
  })

  it("validates stored values", () => {
    expect(isDiscordIpcIssue({ active: true, prompted: false })).toBe(true)
    expect(isDiscordIpcIssue({ active: "yes" })).toBe(false)
    expect(isDiscordIpcIssue(null)).toBe(false)
  })
})

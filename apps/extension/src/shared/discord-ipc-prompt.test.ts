import { describe, expect, it } from "vitest";
import { discordIpcIssueCode, discordIpcIssueOf, isDiscordIpcIssue, markDiscordIpcIssuePrompted, NO_DISCORD_IPC_ISSUE, shouldPromptDiscordIpcIssue, trackDiscordIpcIssue, type DiscordIpcIssue } from "@/shared/discord-ipc-prompt";
import { NATIVE_ERROR_CODES, type NativeResponse } from "@/shared/types/native";

const deniedPong: NativeResponse = {
  type: "PONG",
  connected: true,
  status: "connected",
  discordConnected: false,
  code: NATIVE_ERROR_CODES.discordIpcAccessDenied
};
const deniedError: NativeResponse = {
  type: "ERROR",
  error: "open \\\\.\\pipe\\discord-ipc-0: Access is denied.",
  code: NATIVE_ERROR_CODES.discordIpcAccessDenied
};
const healthyPong: NativeResponse = {
  type: "PONG",
  connected: true,
  status: "discord connected",
  discordConnected: true
};
const plainError: NativeResponse = {
  type: "ERROR",
  error: "open \\\\.\\pipe\\discord-ipc-0: Access is denied."
};

const countOpenings = (messages: NativeResponse[], start: DiscordIpcIssue = NO_DISCORD_IPC_ISSUE) => {
  let issue = start;
  let openings = 0;

  for (const message of messages) {
    issue = trackDiscordIpcIssue(issue, message);

    if (shouldPromptDiscordIpcIssue(issue, false)) {
      openings += 1;
      issue = markDiscordIpcIssuePrompted(issue);
    }
  }

  return { issue, openings };
};

describe("Discord IPC prompt", () => {
  it("tracks prompt lifecycle: opens on code, deduplicates heartbeats, re-opens after recovery, and defers while busy", () => {
    // 1. Opens for PONG or ERROR with code, but ignores healthy or unrelated responses
    expect(countOpenings([deniedPong]).openings).toBe(1);
    expect(countOpenings([deniedError]).openings).toBe(1);
    const nonErrors = countOpenings([
      healthyPong,
      plainError,
      { type: "OK" },
      {
        type: "CONNECTED",
        version: "1.4.5"
      }
    ]);
    expect(nonErrors.openings).toBe(0);
    expect(nonErrors.issue).toEqual(NO_DISCORD_IPC_ISSUE);

    // 2. Deduplicates consecutive heartbeats with the code
    const consecutive = countOpenings([deniedPong, deniedPong, deniedError, deniedPong]);
    expect(consecutive.openings).toBe(1);
    expect(consecutive.issue).toEqual({
      active: true,
      prompted: true
    });

    // 3. Re-opens after resolving and recurring
    expect(countOpenings([deniedPong, deniedPong, healthyPong, deniedPong, deniedError]).openings).toBe(2);

    // 4. Keeps episode on non-heartbeat messages
    const nonHeartbeat = countOpenings([
      deniedPong,
      plainError,
      { type: "OK" },
      deniedPong
    ]);
    expect(nonHeartbeat.openings).toBe(1);
    expect(nonHeartbeat.issue.active).toBe(true);

    // 5. Defers while busy on screen
    const issue = trackDiscordIpcIssue(NO_DISCORD_IPC_ISSUE, deniedPong);
    expect(shouldPromptDiscordIpcIssue(issue, true)).toBe(false);
    expect(shouldPromptDiscordIpcIssue(issue, false)).toBe(true);
    expect(shouldPromptDiscordIpcIssue(markDiscordIpcIssuePrompted(issue), false)).toBe(false);
  });

  it("handles native status mapping and schema validation", () => {
    expect(markDiscordIpcIssuePrompted(NO_DISCORD_IPC_ISSUE)).toBe(NO_DISCORD_IPC_ISSUE);

    const issue = {
      active: true,
      prompted: true
    };
    expect(discordIpcIssueCode(issue)).toBe(NATIVE_ERROR_CODES.discordIpcAccessDenied);
    expect(discordIpcIssueCode(NO_DISCORD_IPC_ISSUE)).toBeUndefined();
    expect(
      discordIpcIssueOf({
        connected: true,
        status: "connected",
        code: discordIpcIssueCode(issue),
        codePrompted: true
      })
    ).toEqual(issue);
    expect(
      discordIpcIssueOf({
        connected: true,
        status: "connected"
      })
    ).toEqual(NO_DISCORD_IPC_ISSUE);

    expect(
      isDiscordIpcIssue({
        active: true,
        prompted: false
      })
    ).toBe(true);
    expect(isDiscordIpcIssue({ active: "yes" })).toBe(false);
    expect(isDiscordIpcIssue(null)).toBe(false);
  });
});
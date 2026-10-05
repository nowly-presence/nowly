import { isNativeErrorCode, NATIVE_ERROR_CODES, type NativeErrorCode, type NativeResponse, type NativeStatus } from "@/shared/types/native"

export const DISCORD_IPC_ISSUE_KEY = "discordIpcIssue"

export type DiscordIpcIssue = { active: boolean; prompted: boolean }

export const NO_DISCORD_IPC_ISSUE: DiscordIpcIssue = { active: false, prompted: false }

export const isDiscordIpcIssue = (value: unknown): value is DiscordIpcIssue =>
  Boolean(value) &&
  typeof value === "object" &&
  typeof (value as DiscordIpcIssue).active === "boolean" &&
  typeof (value as DiscordIpcIssue).prompted === "boolean"

export const trackDiscordIpcIssue = (issue: DiscordIpcIssue, message: NativeResponse): DiscordIpcIssue => {
  if (isNativeErrorCode(message, NATIVE_ERROR_CODES.discordIpcAccessDenied)) return issue.active ? issue : { active: true, prompted: false }
  if (message.type === "PONG" && issue.active) return NO_DISCORD_IPC_ISSUE
  return issue
}

export const markDiscordIpcIssuePrompted = (issue: DiscordIpcIssue): DiscordIpcIssue =>
  issue.active && !issue.prompted ? { active: true, prompted: true } : issue

export const shouldPromptDiscordIpcIssue = (issue: DiscordIpcIssue, waiting: boolean): boolean => issue.active && !issue.prompted && !waiting

export const discordIpcIssueCode = (issue: DiscordIpcIssue): NativeErrorCode | undefined =>
  issue.active ? NATIVE_ERROR_CODES.discordIpcAccessDenied : undefined

export const discordIpcIssueOf = (native: NativeStatus): DiscordIpcIssue => ({
  active: native.code === NATIVE_ERROR_CODES.discordIpcAccessDenied,
  prompted: native.codePrompted === true,
})

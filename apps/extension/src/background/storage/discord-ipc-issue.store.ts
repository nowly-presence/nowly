import { DISCORD_IPC_ISSUE_KEY, isDiscordIpcIssue, NO_DISCORD_IPC_ISSUE, type DiscordIpcIssue } from "@/shared/discord-ipc-prompt"

export const getDiscordIpcIssue = async (): Promise<DiscordIpcIssue> => {
  const result = await chrome.storage.session.get(DISCORD_IPC_ISSUE_KEY)
  const value: unknown = result[DISCORD_IPC_ISSUE_KEY]
  return isDiscordIpcIssue(value) ? value : NO_DISCORD_IPC_ISSUE
}

export const setDiscordIpcIssue = (issue: DiscordIpcIssue): Promise<void> => chrome.storage.session.set({ [DISCORD_IPC_ISSUE_KEY]: issue })

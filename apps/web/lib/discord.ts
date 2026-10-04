import { DISCORD_INVITE_URL } from "./constants";
import { cache } from "react";

// Below this the number reads as a weakness rather than social proof, so the UI falls back to copy without a count.
export const MIN_DISPLAYED_MEMBERS = 250;

const DISCORD_API_URL = "https://discord.com/api/v10";
const REVALIDATE_SECONDS = 60 * 60;
const FETCH_TIMEOUT_MS = 4000;

export type DiscordCommunity = {
  members: number | null
  online: number | null
};

const EMPTY_COMMUNITY: DiscordCommunity = { members: null, online: null };

const inviteCode = (): string | null => {
  const code = new URL(DISCORD_INVITE_URL).pathname.split("/").filter(Boolean).at(-1);
  return code ?? null;
};

export const parseDiscordCommunity = (payload: unknown): DiscordCommunity => {
  if (!payload || typeof payload !== "object") return EMPTY_COMMUNITY;
  const { approximate_member_count: members, approximate_presence_count: online } = payload as Record<string, unknown>;

  return {
    members: typeof members === "number" && members >= MIN_DISPLAYED_MEMBERS ? members : null,
    online: typeof online === "number" && online > 0 ? online : null,
  };
};

// Server-side only, so visitors' browsers never talk to Discord from the page. Any failure just hides the numbers.
export const getDiscordCommunity = cache(async (): Promise<DiscordCommunity> => {
  const code = inviteCode();
  if (!code) return EMPTY_COMMUNITY;

  try {
    const response = await fetch(`${DISCORD_API_URL}/invites/${encodeURIComponent(code)}?with_counts=true`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return EMPTY_COMMUNITY;

    return parseDiscordCommunity(await response.json());
  } catch {
    return EMPTY_COMMUNITY;
  }
});

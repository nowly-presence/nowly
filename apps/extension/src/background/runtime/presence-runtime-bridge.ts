import { handleActivityUpdate, handleClearActivity } from "@/background/managers/activity-manager";
import { USER_SCRIPT_MESSAGE_SOURCE } from "@/shared/constants";
import { getPresences, setDebug } from "@/background/storage/presences.store";
import { urlMatchesPresence } from "@/shared/url-patterns";
import type { PresenceData } from "@/shared/types";

export const isPresenceSender = async (slug: string, sender: chrome.runtime.MessageSender): Promise<boolean> => {
  const url = sender.tab?.url ?? sender.url;

  if (!url) return false;

  const stored = (await getPresences())[slug];

  return Boolean(stored) && urlMatchesPresence(url, (stored.release?.metadata ?? stored.metadata)?.url);
};

const handlePresenceMessage = async (type: unknown, slug: string, payload: {
  activity?: PresenceData;
  stage?: string;
  message?: string;
}, sender: chrome.runtime.MessageSender): Promise<void> => {
  if (!(await isPresenceSender(slug, sender))) return;

  if (type === "ACTIVITY_UPDATE" && payload.activity) await handleActivityUpdate(slug, payload.activity, sender.tab?.id);

  if (type === "CLEAR_ACTIVITY") await handleClearActivity(slug);

  if (type === "DEBUG") {
    await setDebug({
      stage: payload.stage ?? "presence",
      message: `[${slug}] ${payload.message ?? "debug"}`,
      url: sender.tab?.url,
      updatedAt: Date.now()
    });
  }
};

export const registerPresenceRuntimeBridge = (): void => {
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message?.source !== USER_SCRIPT_MESSAGE_SOURCE) return false;

    const payload = message.payload as
      | {
          slug?: string;
          activity?: PresenceData;
          stage?: string;
          message?: string;
        }
      | undefined;
    const slug = payload?.slug;

    if (!payload || typeof slug !== "string" || !slug) return false;

    void handlePresenceMessage(message.type, slug, payload, sender).catch(() => undefined);

    return false;
  });
};
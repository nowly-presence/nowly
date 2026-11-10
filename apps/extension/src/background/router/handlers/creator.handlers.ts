import { syncCreatorDrafts } from "@/background/services/creator-drafts-sync";
import { publishCreatorTest, stopCreatorTest } from "@/background/managers/creator-test";
import type { Handler } from "@/background/router/router";
import { fetchSubmissions, getCreatorAccount, submitPresence } from "@/background/services/creator-api";
import { resolveFocusedTab } from "@/background/services/focused-tab";
import type { CreatorExtraction, CreatorPick } from "@nowly/presence-creator/creator-types";

const isHttpTab = (
  tab: chrome.tabs.Tab | undefined
): tab is chrome.tabs.Tab & {
  id: number;
  url: string;
} => tab?.id != null && typeof tab.url === "string" && /^https?:\/\//.test(tab.url);

const isPick = (value: unknown): value is CreatorPick => Boolean(value) && typeof value === "object" && typeof (value as CreatorPick).selector === "string";

const isExtraction = (value: unknown): value is CreatorExtraction =>
  Boolean(value) && typeof value === "object" && Array.isArray((value as CreatorExtraction).values);

export const handleCreatorPickStart: Handler<"CREATOR_PICK_START"> = async ({ labels }) => {
  const tab = await resolveFocusedTab();

  if (!isHttpTab(tab)) return {
    ok: false,
    error: "NO_TAB"
  };

  try {
    const pick: unknown = await chrome.tabs.sendMessage(tab.id, {
      type: "CREATOR_PICK_START",
      labels
    });
    return isPick(pick) ? { ok: true, pick } : { ok: false, error: "CANCELLED" };
  } catch {
    return {
      ok: false,
      error: "UNREACHABLE"
    };
  }
};

export const handleCreatorPickCancel: Handler<"CREATOR_PICK_CANCEL"> = async () => {
  const tab = await resolveFocusedTab();
  if (isHttpTab(tab)) await chrome.tabs.sendMessage(tab.id, { type: "CREATOR_PICK_CANCEL" }).catch(() => undefined);
  return {
    ok: true
  };
};

export const handleCreatorExtract: Handler<"CREATOR_EXTRACT"> = async ({ variables }) => {
  const tab = await resolveFocusedTab();

  if (!isHttpTab(tab)) return {
    ok: false,
    error: "NO_TAB"
  };

  try {
    const extraction: unknown = await chrome.tabs.sendMessage(tab.id, {
      type: "CREATOR_EXTRACT",
      variables
    });
    return isExtraction(extraction) ? { ok: true, extraction } : { ok: false, error: "UNREACHABLE" };
  } catch {
    return {
      ok: false,
      error: "UNREACHABLE",
      url: tab.url
    };
  }
};

export const handleCreatorHighlight: Handler<"CREATOR_HIGHLIGHT"> = async ({ selector }) => {
  const tab = await resolveFocusedTab();

  if (!isHttpTab(tab)) return {
    ok: false
  };

  const found: unknown = await chrome.tabs
    .sendMessage(tab.id, {
      type: "CREATOR_HIGHLIGHT",
      selector
    })
    .catch(() => false);
  return {
    ok: found === true
  };
};

export const handleCreatorTestActivity: Handler<"CREATOR_TEST_ACTIVITY"> = ({ activity }) => (activity ? publishCreatorTest(activity) : stopCreatorTest());

export const handleCreatorGetAccount: Handler<"CREATOR_GET_ACCOUNT"> = () => getCreatorAccount();

export const handleCreatorSubmit: Handler<"CREATOR_SUBMIT"> = (payload) => submitPresence(payload);

export const handleCreatorFetchSubmissions: Handler<"CREATOR_FETCH_SUBMISSIONS"> = ({ ids }) => fetchSubmissions(ids);

export const handleCreatorSyncDrafts: Handler<"CREATOR_SYNC_DRAFTS"> = () => syncCreatorDrafts();
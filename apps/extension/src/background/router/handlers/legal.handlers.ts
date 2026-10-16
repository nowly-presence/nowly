import type { Handler } from "@/background/router/router";
import { acceptLegalDocuments, checkLegalDocuments, getLegalState } from "@/background/services/legal-documents";
import { broadcastActiveTab } from "@/background/managers/activity-manager";

export const handleGetLegalState: Handler<"GET_LEGAL_STATE"> = () => getLegalState();

export const handleCheckLegalDocuments: Handler<"CHECK_LEGAL_DOCUMENTS"> = async () => {
  const state = await checkLegalDocuments();
  await broadcastActiveTab();
  return state;
};

export const handleAcceptLegalDocuments: Handler<"ACCEPT_LEGAL_DOCUMENTS"> = async (input, sender) => {
  if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL("sidepanel/index.html")) {
    return { ok: false, state: await getLegalState(), error: "confirmationRequired" };
  }
  const result = await acceptLegalDocuments(input);
  if (result.ok) await broadcastActiveTab();
  return result;
};

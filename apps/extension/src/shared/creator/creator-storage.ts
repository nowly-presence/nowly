import { normalizeDraft } from "@nowly/presence-creator/creator-draft";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";

export const CREATOR_DRAFTS_KEY = "creatorDrafts";

export type CreatorDrafts = Record<string, CreatorDraft>;

const isDraftMap = (value: unknown): value is CreatorDrafts => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const loadDrafts = async (): Promise<CreatorDrafts> => {
  const result = await chrome.storage.local.get(CREATOR_DRAFTS_KEY);

  const value = result[CREATOR_DRAFTS_KEY];
  return isDraftMap(value)
    ? Object.fromEntries(
        Object.entries(value).map(([id, draft]) => [
          id,
          normalizeDraft(draft)
        ])
      )
    : {};
};

export const saveDraft = async (draft: CreatorDraft): Promise<void> => {
  const drafts = await loadDrafts();
  await chrome.storage.local.set({
    [CREATOR_DRAFTS_KEY]: {
      ...drafts,
      [draft.id]: draft
    }
  });
};

export const deleteDraft = async (id: string): Promise<void> => {
  const { [id]: _removed, ...rest } = await loadDrafts();
  await chrome.storage.local.set({ [CREATOR_DRAFTS_KEY]: rest });
};

export const sortedDrafts = (drafts: CreatorDrafts): CreatorDraft[] => Object.values(drafts).sort((a, b) => b.updatedAt - a.updatedAt);
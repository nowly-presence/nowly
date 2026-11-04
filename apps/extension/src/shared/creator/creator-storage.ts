import { normalizeDraft } from "@nowly/presence-creator/creator-draft";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";

export const CREATOR_DRAFTS_KEY = "creatorDrafts";

export const CREATOR_TOMBSTONES_KEY = "creatorDraftTombstones";

export type CreatorDrafts = Record<string, CreatorDraft>;
export type CreatorTombstones = Record<string, number>;

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

export const loadTombstones = async (): Promise<CreatorTombstones> => {
  const value: unknown = (await chrome.storage.local.get(CREATOR_TOMBSTONES_KEY))[CREATOR_TOMBSTONES_KEY];
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === "number"));
};

export const saveTombstones = async (tombstones: CreatorTombstones): Promise<void> => {
  await chrome.storage.local.set({ [CREATOR_TOMBSTONES_KEY]: tombstones });
};

export const deleteDraft = async (id: string): Promise<void> => {
  const { [id]: _removed, ...rest } = await loadDrafts();
  const tombstones = await loadTombstones();
  await chrome.storage.local.set({
    [CREATOR_DRAFTS_KEY]: rest,
    [CREATOR_TOMBSTONES_KEY]: {
      ...tombstones,
      [id]: Date.now()
    }
  });
};

export const sortedDrafts = (drafts: CreatorDrafts): CreatorDraft[] => Object.values(drafts).sort((a, b) => b.updatedAt - a.updatedAt);
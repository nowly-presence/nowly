import { signOutLocally } from "@/background/services/account-sync";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { createDebouncedTask } from "@/background/services/debounced-task";
import { getAccount } from "@/background/storage/account.store";
import { planDraftSync, type RemoteDraftEntry } from "@/shared/creator/creator-draft-sync-plan";
import { CREATOR_DRAFTS_KEY, CREATOR_TOMBSTONES_KEY, loadDrafts, loadTombstones, saveTombstones } from "@/shared/creator/creator-storage";
import { normalizeDraft } from "@nowly/presence-creator/creator-draft";
import { parseSubmission } from "@nowly/presence-creator/creator-submission";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";

const HTTP_UNAUTHORIZED = 401;
const PUSH_DEBOUNCE_MS = 4_000;

let running: Promise<void> | null = null;
let rerun = false;

const isEntry = (value: unknown): value is RemoteDraftEntry => {
  const entry = value as Partial<RemoteDraftEntry> | null;
  return Boolean(entry) && typeof entry?.id === "string" && typeof entry.updatedAt === "number" && typeof entry.deleted === "boolean";
};

const request = async (token: string, path: string, init?: RequestInit): Promise<Response | null> => {
  try {
    const response = await fetch(`${getEffectiveApiUrl()}/me/creator-drafts${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {})
      }
    });

    if (response.status === HTTP_UNAUTHORIZED) {
      if ((await getAccount())?.token === token) await signOutLocally();

      return null;
    }

    return response;
  } catch {
    return null;
  }
};

const writeLocal = async (id: string, draft: CreatorDraft | null): Promise<void> => {
  const drafts = await loadDrafts();

  const current = drafts[id];

  if (draft && current && current.updatedAt >= draft.updatedAt) return;
  if (!draft && !current) return;

  const { [id]: _removed, ...rest } = drafts;
  await chrome.storage.local.set({ [CREATOR_DRAFTS_KEY]: draft ? { ...drafts, [id]: draft } : rest });
};

const refreshStatuses = async (token: string): Promise<void> => {
  const drafts = await loadDrafts();
  const submitted = Object.values(drafts).filter((draft) => draft.submission);

  if (submitted.length === 0) return;

  const ids = submitted.flatMap((draft) => (draft.submission ? [draft.submission.id] : []));

  const response = await fetch(`${getEffectiveApiUrl()}/me/presence-submissions?ids=${ids.map(encodeURIComponent).join(",")}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  }).catch(() => null);

  if (!response?.ok) return;

  const body: unknown = await response.json().catch(() => null);

  const latest = Array.isArray(body) ? body.flatMap((entry) => parseSubmission(entry) ?? []) : [];
  const fresh = await loadDrafts();

  let changed = false;

  for (const submission of latest) {
    const draft = Object.values(fresh).find((entry) => entry.submission?.id === submission.id);

    if (!draft?.submission || draft.submission.updatedAt >= submission.updatedAt) continue;

    fresh[draft.id] = { ...draft, submission };
    changed = true;
  }

  if (changed) await chrome.storage.local.set({ [CREATOR_DRAFTS_KEY]: fresh });
};

const syncOnce = async (): Promise<void> => {
  const account = await getAccount();

  if (!account?.scopes.includes("creator")) return;

  const token = account.token;
  const listing = await request(token, "");

  if (!listing?.ok) return;

  const body: unknown = await listing.json().catch(() => null);

  const items = (
    body as {
      items?: unknown;
    } | null
  )?.items;

  if (!Array.isArray(items)) return;

  const drafts = await loadDrafts();

  const tombstones = await loadTombstones();

  const cleared = new Set<string>();

  for (const action of planDraftSync(drafts, tombstones, items.filter(isEntry))) {
    if (action.kind === "clearTombstone") cleared.add(action.id);
    else if (action.kind === "removeLocal") await writeLocal(action.id, null);
    else if (action.kind === "pull") {
      const response = await request(token, `/${action.id}`);

      const remote: unknown = response?.ok ? await response.json().catch(() => null) : null;
      const value = (
        remote as {
          value?: unknown;
        } | null
      )?.value;

      if (
        value &&
        typeof value === "object" &&
        (
          value as {
            id?: unknown;
          }
        ).id === action.id
      ) await writeLocal(action.id, normalizeDraft(value as CreatorDraft));
    } else if (action.kind === "push") {
      const draft = drafts[action.id];

      if (draft) await request(token, `/${action.id}`, {
        method: "PUT",
        body: JSON.stringify({
          updatedAt: draft.updatedAt,
          value: draft
        })
      });
    } else if (action.kind === "deleteRemote") {
      const response = await request(token, `/${action.id}`, { method: "DELETE" });

      if (response?.ok) cleared.add(action.id);
    }
  }

  if (cleared.size > 0) {
    const current = await loadTombstones();
    await saveTombstones(Object.fromEntries(Object.entries(current).filter(([id, at]) => !cleared.has(id) || at !== tombstones[id])));
  }

  await refreshStatuses(token);
};

export const syncCreatorDrafts = async (): Promise<void> => {
  if (running) {
    rerun = true;
    return running;
  }

  running = (async () => {
    try {
      do {
        rerun = false;
        await syncOnce();
      } while (rerun);
    } catch {
      return;
    } finally {
      running = null;
    }
  })();
  return running;
};

export const registerCreatorDraftSync = (): void => {
  const schedulePush = createDebouncedTask(() => void syncCreatorDrafts(), PUSH_DEBOUNCE_MS);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !(CREATOR_DRAFTS_KEY in changes || CREATOR_TOMBSTONES_KEY in changes)) return;

    schedulePush();
  });
};
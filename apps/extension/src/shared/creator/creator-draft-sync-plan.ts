import type { CreatorTombstones } from "@/shared/creator/creator-storage";

export type RemoteDraftEntry = {
  id: string;
  updatedAt: number;
  deleted: boolean;
};

export type DraftSyncAction = {
  kind: "pull" | "push" | "removeLocal" | "deleteRemote" | "clearTombstone";
  id: string;
};

export const planDraftSync = (local: Record<string, { updatedAt: number }>, tombstones: CreatorTombstones, remote: RemoteDraftEntry[]): DraftSyncAction[] => {
  const remoteById = new Map(remote.map((entry) => [entry.id, entry]));
  const ids = new Set([...Object.keys(local), ...Object.keys(tombstones), ...remote.map((entry) => entry.id)]);
  const actions: DraftSyncAction[] = [];

  for (const id of ids) {
    const draft = local[id];
    const tombstone = tombstones[id];
    const entry = remoteById.get(id);
    const localTime = Math.max(draft?.updatedAt ?? 0, tombstone ?? 0);
    const localDeleted = tombstone !== undefined && tombstone >= (draft?.updatedAt ?? 0);
    const remoteTime = entry?.updatedAt ?? 0;

    if (draft && tombstone !== undefined && !localDeleted) actions.push({ kind: "clearTombstone", id });

    if (remoteTime > localTime) {
      if (entry?.deleted) {
        if (draft) actions.push({ kind: "removeLocal", id });
        if (tombstone !== undefined) actions.push({ kind: "clearTombstone", id });
      } else actions.push({ kind: "pull", id });
    } else if (localTime > remoteTime) {
      if (localDeleted) {
        if (entry && !entry.deleted) actions.push({ kind: "deleteRemote", id });
        else actions.push({ kind: "clearTombstone", id });
      } else if (draft) actions.push({ kind: "push", id });
    } else if (localDeleted && localTime > 0) actions.push({ kind: "clearTombstone", id });
  }

  return actions;
};

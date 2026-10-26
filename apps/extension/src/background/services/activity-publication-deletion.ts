import { ownedPublicationMapSchema, publicationIdSchema, publicationAttemptsSchema, ownedPublicationResponseSchema } from "@nowly/shared/activity-publication";
import { getAccount } from "@/background/storage/account.store";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { publicationAbsence } from "@/background/services/activity-publication-absence";

export const PUBLICATION_ATTEMPTS_KEY = "activityPublicationAttempts";

type PublicationAttempts = Record<
  string,
  {
    id: string;
    apiBase: string;
    pending: boolean;
  }
>;

export const publicationApiBase = (): string => new URL(getEffectiveApiUrl()).href.replace(/\/$/, "");

export const readPublicationAttempts = async (): Promise<PublicationAttempts> => {
  const stored = await chrome.storage.local.get(PUBLICATION_ATTEMPTS_KEY);

  const value: unknown = stored[PUBLICATION_ATTEMPTS_KEY];

  if (value === undefined) return {};

  return publicationAttemptsSchema.parse(value);
};

export const recordPublicationAttempt = async (key: string, id: string, apiBase = publicationApiBase()): Promise<void> => {
  const attempts = await readPublicationAttempts();

  if (attempts[key] && (attempts[key].id !== id || attempts[key].apiBase !== apiBase)) throw new Error("INVALID_PUBLICATION_STATE");

  await chrome.storage.local.set({
    [PUBLICATION_ATTEMPTS_KEY]: {
      ...attempts,
      [key]: {
        id: publicationIdSchema.parse(id),
        apiBase,
        pending: true
      }
    }
  });
};

export const assertPublicationBackend = async (key: string, known: boolean, apiBase: string): Promise<void> => {
  const references = await readPublicationAttempts();

  const suffix = key.slice(key.lastIndexOf(":"));

  if (Object.entries(references).some(([entryKey, entry]) => entryKey.endsWith(suffix) && entry.apiBase !== apiBase)) throw new Error(
    "INVALID_PUBLICATION_STATE"
  );

  const reference = references[key];

  if ((known && !reference) || (reference && reference.apiBase !== apiBase)) throw new Error("INVALID_PUBLICATION_STATE");
};

export type PublicationDeletionError = "PUBLICATION_ACTIVE" | "PUBLICATION_CHECK_REQUIRED";

export const publicationDeletionError = async (localId: string): Promise<PublicationDeletionError | null> => {
  try {
    const stored = await chrome.storage.local.get("activityPublications");

    const apiBase = publicationApiBase();

    const publications = ownedPublicationMapSchema.parse(stored.activityPublications ?? {});
    const attempts = await readPublicationAttempts();
    const keys = [...new Set([...Object.keys(publications), ...Object.keys(attempts)])].filter((key) => key.endsWith(`:${localId}`));

    if (keys.length === 0) return null;

    const ids = new Set<string>();

    for (const key of keys) {
      const reference = attempts[key];

      if (!reference || reference.apiBase !== apiBase) return "PUBLICATION_CHECK_REQUIRED";
      if (publications[key] && reference.id !== publications[key].id) return "PUBLICATION_CHECK_REQUIRED";

      ids.add(reference.id);
    }

    for (const id of ids) {
      const response = await fetch(`${apiBase}/activity-publications/${id}`, {
        cache: "no-store",
        credentials: "omit",
        redirect: "error"
      });

      if (response.ok) return "PUBLICATION_ACTIVE";

      const absence = await publicationAbsence(response);

      if (absence === "NOT_FOUND") continue;
      if (absence !== "UNPUBLISHED") return "PUBLICATION_CHECK_REQUIRED";

      const matchingKeys = keys.filter((key) => attempts[key].id === id);

      const account = await getAccount();

      const ownerKey = account ? `${account.user.id}:${localId}` : "";

      if (!account?.scopes.includes("creator") || matchingKeys.some((key) => key !== ownerKey || attempts[key].pending)) return "PUBLICATION_CHECK_REQUIRED";

      const owned = await fetch(`${apiBase}/me/activity-publications/${localId}`, {
        headers: { Authorization: `Bearer ${account.token}` },
        cache: "no-store",
        credentials: "omit",
        redirect: "error"
      });

      if (!owned.ok) return "PUBLICATION_CHECK_REQUIRED";

      const { publication } = ownedPublicationResponseSchema.parse(await owned.json());

      if (
        !publication ||
        publication.id !== id ||
        publication.published ||
        publication.revision !== publications[ownerKey]?.revision ||
        publication.revision === 0
      ) return "PUBLICATION_CHECK_REQUIRED";
    }

    return null;
  } catch {
    return "PUBLICATION_CHECK_REQUIRED";
  }
};
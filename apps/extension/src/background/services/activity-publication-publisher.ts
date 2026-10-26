import { ownedPublicationSchema, ownedPublicationMapSchema, ownedPublicationResponseSchema } from "@nowly/shared/activity-publication";
import { getEffectiveWebUrl } from "@/background/services/api-state";
import { getAccount } from "@/background/storage/account.store";
import { getCustomActivities } from "@/background/storage/custom-activities.store";
import { withCustomActivityWrite } from "@/background/services/custom-activity-write";
import { hasPublicationChanges, publicationFailure, publicationImageData } from "@/background/services/activity-publication-data";
import { portableActivity } from "@/shared/activity-publication";
import { PUBLICATION_ATTEMPTS_KEY, readPublicationAttempts, recordPublicationAttempt, assertPublicationBackend, publicationApiBase } from "@/background/services/activity-publication-deletion";

export type PublishResult = {
  ok: true;
  url: string;
  revision: number;
  published: boolean;
} | {
  ok: false;
  error: string;
};
export type OwnedPublicationResult =
  | (PublishResult & {
      hasChanges?: boolean | null;
    })
  | {
      ok: true;
      url: null;
    };

const PUBLICATIONS_KEY = "activityPublications";

const publicationUrl = (id: string): string => `${getEffectiveWebUrl()}/activities/${id}`;

const storedPublications = async () => {
  const stored = await chrome.storage.local.get(PUBLICATIONS_KEY);
  return ownedPublicationMapSchema.parse(stored[PUBLICATIONS_KEY] ?? {});
};

const publisherAccount = async () => {
  const account = await getAccount();

  if (!account?.scopes.includes("creator")) throw new Error("CREATOR_REQUIRED");

  return account;
};

export const getOwnedPublication = (localId: string): Promise<OwnedPublicationResult> =>
  withCustomActivityWrite(async () => {
    try {
      const account = await publisherAccount();

      const apiBase = publicationApiBase();

      const activity = (await getCustomActivities()).items.find((item) => item.id === localId);

      if (!activity) throw new Error("INVALID");

      const publications = await storedPublications();

      const key = `${account.user.id}:${localId}`;
      await assertPublicationBackend(key, !!publications[key], apiBase);

      const response = await fetch(`${apiBase}/me/activity-publications/${localId}`, {
        headers: { Authorization: `Bearer ${account.token}` },
        cache: "no-store",
        credentials: "omit",
        redirect: "error"
      });

      if (response.status === 401) throw new Error("CREATOR_REQUIRED");
      if (!response.ok) throw new Error("UNAVAILABLE");

      const { publication } = ownedPublicationResponseSchema.parse(await response.json());

      if (publication) {
        if (publications[key]?.id !== publication.id) await recordPublicationAttempt(key, publication.id, apiBase);
        publications[key] = publication;
      }

      await chrome.storage.local.set({ [PUBLICATIONS_KEY]: publications });

      if (!publication) return {
        ok: true,
        url: null
      };

      return {
        ok: true,
        url: publicationUrl(publication.id),
        revision: publication.revision,
        published: publication.published,
        hasChanges: publication.published ? await hasPublicationChanges(activity, publication.id, publication.revision) : true
      };
    } catch (error) {
      return publicationFailure(error);
    }
  });

export const publishActivity = (localId: string, baseRevision: number, unpublish = false): Promise<PublishResult> =>
  withCustomActivityWrite(async () => {
    try {
      const account = await publisherAccount();

      const apiBase = publicationApiBase();

      const activity = (await getCustomActivities()).items.find((item) => item.id === localId);

      if (!activity) throw new Error("INVALID");

      const publications = await storedPublications();

      const key = `${account.user.id}:${localId}`;
      await assertPublicationBackend(key, !!publications[key], apiBase);
      let previous = publications[key];

      if (unpublish && !previous) throw new Error("INVALID");
      if (!Number.isInteger(baseRevision) || baseRevision < 0) throw new Error("INVALID");
      if ((previous?.revision ?? 0) !== baseRevision) throw new Error("REVISION_CONFLICT");

      const portable = unpublish ? undefined : portableActivity(activity, await publicationImageData());

      if (!previous) {
        const reservation = await fetch(`${apiBase}/me/activity-publications/${localId}`, {
          method: "POST",
          redirect: "error",
          credentials: "omit",
          headers: {
            Authorization: `Bearer ${account.token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ activity: portable })
        });

        if (reservation.status === 401) throw new Error("CREATOR_REQUIRED");
        if (reservation.status === 409) throw new Error("REVISION_CONFLICT");
        if (!reservation.ok) throw new Error("UNAVAILABLE");

        previous = ownedPublicationSchema.parse(await reservation.json());
        await recordPublicationAttempt(key, previous.id, apiBase);
        publications[key] = previous;
        await chrome.storage.local.set({ [PUBLICATIONS_KEY]: publications });

        if (previous.revision !== baseRevision) throw new Error("REVISION_CONFLICT");
      }

      const pathId = unpublish ? previous.id : localId;
      const body = unpublish ? { baseRevision } : { id: previous.id, activity: portable, baseRevision };
      if (!unpublish) await recordPublicationAttempt(key, previous.id, apiBase);
      const response = await fetch(`${apiBase}/me/activity-publications/${pathId}`, {
        method: unpublish ? "DELETE" : "PUT",
        redirect: "error",
        credentials: "omit",
        headers: {
          Authorization: `Bearer ${account.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (response.status === 401) throw new Error("CREATOR_REQUIRED");
      if (response.status === 409) throw new Error("REVISION_CONFLICT");
      if (!response.ok) throw new Error("UNAVAILABLE");

      const result = ownedPublicationSchema.omit({ published: true }).parse(await response.json());

      if (result.id !== previous.id || result.revision !== baseRevision + 1) throw new Error("INVALID");

      publications[key] = {
        ...result,
        published: !unpublish
      };
      const attempts = await readPublicationAttempts();
      if (unpublish && attempts[key]) attempts[key].pending = false;
      await chrome.storage.local.set({
        [PUBLICATIONS_KEY]: publications,
        [PUBLICATION_ATTEMPTS_KEY]: attempts
      });
      return {
        ok: true,
        url: publicationUrl(result.id),
        revision: result.revision,
        published: !unpublish
      };
    } catch (error) {
      return publicationFailure(error);
    }
  });
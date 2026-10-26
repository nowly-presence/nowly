import { PUBLICATION_MAX_BYTES, publicationSchema, type ActivityPublication, type PublicationReview } from "@nowly/shared/activity-publication";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { getCustomImages } from "@/background/storage/custom-activities.store";
import { activityFingerprint, portableActivity } from "@/shared/activity-publication";
import type { CustomActivity } from "@/shared/types";

export const publicationImageData = async (): Promise<Record<string, string>> => {
  const images = await getCustomImages();
  return Object.fromEntries(Object.entries(images).map(([hash, image]) => [hash, image.dataUrl]));
};

export const localPublicationFingerprint = async (activity: CustomActivity): Promise<string> => {
  const images = await publicationImageData();
  return activityFingerprint(portableActivity(activity, images), activity.detectionUrl);
};

export const hasPublicationChanges = async (activity: CustomActivity, id: string, revision: number): Promise<boolean | null> => {
  try {
    const response = await fetch(`${getEffectiveApiUrl()}/activity-publications/${id}`, {
      cache: "no-store",
      credentials: "omit",
      redirect: "error"
    });

    if (!response.ok) return null;

    const text = await response.text();

    if (new TextEncoder().encode(text).length > PUBLICATION_MAX_BYTES) return null;

    const publication = publicationSchema.parse(JSON.parse(text));

    if (publication.id !== id || publication.revision !== revision) return null;

    const local = portableActivity(activity, await publicationImageData());
    return (await activityFingerprint(local)) !== (await activityFingerprint(publication.activity));
  } catch {
    return null;
  }
};

export const fetchReviewedPublication = async (review: PublicationReview): Promise<ActivityPublication> => {
  const response = await fetch(`${getEffectiveApiUrl()}/activity-publications/${review.id}`, {
    cache: "no-store",
    credentials: "omit",
    redirect: "error"
  });

  if (!response.ok) throw new Error("UNAVAILABLE");

  const text = await response.text();

  if (new TextEncoder().encode(text).length > PUBLICATION_MAX_BYTES) throw new Error("INVALID");

  const publication = publicationSchema.parse(JSON.parse(text));
  const fingerprint = await activityFingerprint(publication.activity);

  if (publication.id !== review.id || publication.revision !== review.revision || fingerprint !== review.fingerprint) {
    throw new Error("REVISION_CHANGED");
  }

  return publication;
};

const PUBLICATION_ERRORS = new Set([
  "UNAVAILABLE",
  "INVALID",
  "REVISION_CHANGED",
  "LOCAL_CHANGED",
  "EDITOR_OPEN",
  "LIMIT_REACHED",
  "MISSING_IMAGE",
  "CREATOR_REQUIRED",
  "REVISION_CONFLICT"
]);

export const publicationFailure = (
  error: unknown
): {
  ok: false;
  error: string;
} => ({
  ok: false,
  error: error instanceof Error && PUBLICATION_ERRORS.has(error.message) ? error.message : "UNAVAILABLE"
});
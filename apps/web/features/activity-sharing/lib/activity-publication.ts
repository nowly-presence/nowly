import { canonicalJson } from "@nowly/shared";
import { publicationSchema, PUBLICATION_MAX_BYTES, type PortableActivity, type PublicationReview } from "@nowly/shared/activity-publication";
import { presenceApiBaseUrl } from "@/lib/presence-api-client";

export const publicationFingerprint = async (activity: PortableActivity): Promise<string> => {
  const bytes = new TextEncoder().encode(canonicalJson(activity));
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const fetchActivityPublication = async (id: string) => {
  const response = await fetch(`${presenceApiBaseUrl()}/activity-publications/${id}`, {
    cache: "no-store",
    credentials: "omit",
    redirect: "error"
  });

  if (!response.ok) throw new Error("UNAVAILABLE");

  const text = await response.text();

  if (new TextEncoder().encode(text).length > PUBLICATION_MAX_BYTES) throw new Error("INVALID");

  const publication = publicationSchema.parse(JSON.parse(text));

  if (publication.id !== id) throw new Error("INVALID");

  const review: PublicationReview = {
    id,
    revision: publication.revision,
    fingerprint: await publicationFingerprint(publication.activity)
  };
  return { publication, review };
};
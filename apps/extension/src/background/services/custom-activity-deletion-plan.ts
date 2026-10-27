import { publicationDeletionError } from "@/background/services/activity-publication-deletion";
import { getOwnedPublication } from "@/background/services/activity-publication-publisher";

export type CustomActivityDeletionPlan = {
  ok: true;
  withdrawal: {
    revision: number;
  } | null;
} | {
  ok: false;
  error: string;
};

export const getCustomActivityDeletionPlan = async (id: string): Promise<CustomActivityDeletionPlan> => {
  const error = await publicationDeletionError(id);

  if (!error) return {
    ok: true,
    withdrawal: null
  };

  const publication = await getOwnedPublication(id);

  if (!publication.ok) return publication;
  if (!publication.url) return {
    ok: false,
    error
  };

  return {
    ok: true,
    withdrawal: { revision: publication.revision }
  };
};
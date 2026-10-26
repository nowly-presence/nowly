import { publicationApplySchema, publicationReviewSchema, type PublicationApply, type PublicationResult, type PublicationReview, type PublicationStatus } from "@nowly/shared/activity-publication";
import { getCustomActivities, updateCustomActivities } from "@/background/storage/custom-activities.store";
import { withCustomActivityWrite } from "@/background/services/custom-activity-write";
import { uploadCustomImage } from "@/background/managers/custom-activity-manager";
import { dismissCustomActivityDetection, readCustomActivityDetection } from "@/background/services/custom-activity-detection";
import { broadcastActiveTab } from "@/background/managers/activity-manager";
import { activityFingerprint } from "@/shared/activity-publication";
import { parseActivityFile } from "@/shared/custom-activity-share";
import { CUSTOM_ACTIVITIES_MAX } from "@/shared/custom-activity";
import type { CustomActivitiesState, CustomActivity } from "@/shared/types";
import { assertCustomActivityEditorClosed } from "@/background/services/custom-activity-editors";
import { fetchReviewedPublication, localPublicationFingerprint, publicationFailure } from "@/background/services/activity-publication-data";

const replaceInactiveCopy = (state: CustomActivitiesState, activity: CustomActivity, existing?: CustomActivity): CustomActivitiesState => {
  const replacingActive = Boolean(existing && state.activeId === existing.id);
  const items = existing ? state.items.map((item) => (item.id === existing.id ? activity : item)) : [activity, ...state.items];
  return {
    items,
    activeId: replacingActive ? null : state.activeId,
    activatedAt: replacingActive ? null : state.activatedAt
  };
};

export const publicationStatus = async (input: PublicationReview): Promise<PublicationStatus> => {
  try {
    const review = publicationReviewSchema.parse(input);
    await fetchReviewedPublication(review);
    return await withCustomActivityWrite(async () => {
      const activity = (await getCustomActivities()).items.find((item) => item.provenance?.publicationId === review.id);
      const fingerprint = activity ? await localPublicationFingerprint(activity) : null;
      const baseline = activity?.provenance ? await activityFingerprint(activity.provenance.baseline) : null;
      return {
        ok: true,
        installed: Boolean(activity),
        revision: activity?.provenance?.revision ?? null,
        modified: fingerprint !== baseline,
        localFingerprint: fingerprint
      };
    });
  } catch (error) {
    return publicationFailure(error);
  }
};

export const applyPublication = async (input: PublicationApply): Promise<PublicationResult> => {
  try {
    const review = publicationApplySchema.parse(input);
    const publication = await fetchReviewedPublication(review);
    return await withCustomActivityWrite(async () => {
      const current = await getCustomActivities();

      const existing = current.items.find((item) => item.provenance?.publicationId === publication.id);
      const alreadyInstalled = existing?.provenance?.revision === review.revision;

      if (alreadyInstalled && review.choice === "install") return {
        ok: true
      };

      const fingerprint = existing ? await localPublicationFingerprint(existing) : null;

      if (fingerprint !== review.localFingerprint) throw new Error("LOCAL_CHANGED");
      if (review.choice === "keep") return {
        ok: true
      };

      if (existing) await assertCustomActivityEditorClosed(existing.id);
      if (existing && review.choice === "install") throw new Error("LOCAL_CHANGED");
      if (!existing && review.choice !== "install") throw new Error("LOCAL_CHANGED");
      if (!existing && current.items.length >= CUSTOM_ACTIVITIES_MAX) throw new Error("LIMIT_REACHED");

      const parsed = parseActivityFile(
        JSON.stringify({
          format: "nowly.custom-activity",
          version: 1,
          activity: publication.activity
        })
      );

      if (!parsed.ok) throw new Error("INVALID");

      for (const field of ["largeImage", "smallImage"] as const) {
        const dataUrl = parsed.images[field];

        if (!dataUrl) continue;

        const uploaded = await uploadCustomImage(dataUrl);

        if (!uploaded.ok) throw new Error("UNAVAILABLE");

        parsed.draft[field] = uploaded.image;
      }

      const now = Date.now();
      const provenance = {
        publicationId: publication.id,
        revision: publication.revision,
        baseline: publication.activity
      };
      const activity: CustomActivity = {
        ...parsed.draft,
        id: existing?.id ?? crypto.randomUUID(),
        detectionUrl: "",
        createdAt: existing?.createdAt ?? now,
        updatedAt: Math.max(now, (existing?.updatedAt ?? 0) + 1),
        provenance
      };
      const detection = await readCustomActivityDetection();
      if (existing && detection?.activityId === existing.id) await dismissCustomActivityDetection(existing.id);
      await updateCustomActivities((state) => replaceInactiveCopy(state, activity, existing));
      await broadcastActiveTab();
      return {
        ok: true
      };
    });
  } catch (error) {
    return publicationFailure(error);
  }
};
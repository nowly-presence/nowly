import { canonicalJson } from "@nowly/shared";
import { portableActivitySchema, type PortableActivity } from "@nowly/shared/activity-publication";
import { buildActivityFile } from "@/shared/custom-activity-share";
import { sha256Hex } from "@/shared/custom-image";
import type { CustomActivity } from "@/shared/types";

export const portableActivity = (activity: CustomActivity, images: Record<string, string>): PortableActivity => {
  for (const image of [activity.largeImage, activity.smallImage]) {
    if (image.kind === "upload" && !images[image.hash]) throw new Error("MISSING_IMAGE");
  }

  const { detectionUrl: _private, ...portable } = buildActivityFile(activity, images).activity;
  return portableActivitySchema.parse(portable);
};

export const activityFingerprint = (activity: PortableActivity, detectionUrl = ""): Promise<string> =>
  sha256Hex(new TextEncoder().encode(canonicalJson(detectionUrl ? { ...activity, detectionUrl } : activity)));
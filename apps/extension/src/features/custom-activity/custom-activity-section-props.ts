import type { CustomActivityErrors } from "@/shared/custom-activity";
import type { CustomActivityDraft } from "@/shared/types";

export type CustomActivitySectionProps = {
  draft: CustomActivityDraft;
  patch: (partial: Partial<CustomActivityDraft>) => void;
  errors: CustomActivityErrors;
};
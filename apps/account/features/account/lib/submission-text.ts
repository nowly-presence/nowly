import type { LocalizedText, ReviewVerdict, SubmissionStatus } from "@/features/account/lib/submission-api";

export const pickText = (text: LocalizedText | undefined, locale: string, baseLocale: string): string =>
  text?.[locale] ?? text?.[baseLocale] ?? Object.values(text ?? {})[0] ?? "";

export const statusVariant = (status: SubmissionStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "published" || status === "approved") return "default";
  if (status === "rejected") return "destructive";
  if (status === "changes_requested") return "outline";

  return "secondary";
};

const VERDICT_SOURCES: Record<ReviewVerdict, readonly SubmissionStatus[]> = {
  approve: ["submitted"],
  comment: ["submitted", "changes_requested", "approved", "in_progress"],
  request_changes: ["submitted", "approved", "in_progress"],
  reject: ["submitted", "approved"]
};

export const allowedVerdicts = (status: SubmissionStatus): ReviewVerdict[] =>
  (Object.keys(VERDICT_SOURCES) as ReviewVerdict[]).filter((verdict) => VERDICT_SOURCES[verdict].includes(status));

export const PUBLISHABLE_STATUSES: readonly SubmissionStatus[] = ["submitted", "approved"];

export const submissionHref = (id: string): string => `/creations/${encodeURIComponent(id)}`;
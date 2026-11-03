import type { MessageKey } from "@/hooks/i18n-provider";
import type { FieldComment } from "@/shared/admin/admin-types";

const FIELD_KEYS: Record<string, MessageKey> = {
  definition: "submissionReview.field.definition",
  name: "submissionReview.field.name",
  domains: "submissionReview.field.domains",
  color: "submissionReview.field.color",
  category: "submissionReview.field.category",
  baseLocale: "submissionReview.field.languages",
  translationMode: "submissionReview.field.languages",
  locales: "submissionReview.field.languages",
  description: "submissionReview.field.description",
  longDescription: "submissionReview.field.description",
  features: "submissionReview.field.features",
  browsingFallback: "submissionReview.field.fallback",
  page: "submissionReview.field.page",
  "page.name": "submissionReview.field.pageName",
  "page.match": "submissionReview.field.pageMatch",
  "page.activityType": "submissionReview.field.pageType",
  "page.variables": "submissionReview.field.pageVariables",
  "page.details": "submissionReview.field.pageDetails",
  "page.state": "submissionReview.field.pageState",
  "page.largeImage": "submissionReview.field.pageImage",
  "page.timestamps": "submissionReview.field.pageTimestamps",
  "page.button": "submissionReview.field.pageButton"
};

export const COMMENT_FIELDS: readonly string[] = [
  "name",
  "domains",
  "color",
  "category",
  "locales",
  "description",
  "features",
  "browsingFallback",
  "page.name",
  "page.match",
  "page.activityType",
  "page.variables",
  "page.details",
  "page.state",
  "page.largeImage",
  "page.timestamps",
  "page.button"
];

export const PAGE_COMMENT_PREFIX = "page.";

export const fieldKey = (field: string): MessageKey | null => FIELD_KEYS[field] ?? null;

export const commentTarget = (comment: Pick<FieldComment, "field" | "page">, label: (key: MessageKey) => string): string => {
  const key = fieldKey(comment.field);
  const field = key ? label(key) : comment.field;
  return comment.page ? `${comment.page}: ${field}` : field;
};

export const needsPage = (field: string): boolean => field.startsWith(PAGE_COMMENT_PREFIX);
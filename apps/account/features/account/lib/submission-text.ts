import type { LocalizedText, SubmissionDetail, SubmissionPage, SubmissionStatus } from "@/features/account/lib/submission-api";

export const pickText = (text: LocalizedText | undefined, locale: string, baseLocale: string): string =>
  text?.[locale] ?? text?.[baseLocale] ?? Object.values(text ?? {})[0] ?? "";

export const statusVariant = (status: SubmissionStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "published" || status === "approved") return "default";
  if (status === "rejected") return "destructive";
  if (status === "changes_requested") return "outline";

  return "secondary";
};

export const submissionHref = (id: string): string => `/creations/${encodeURIComponent(id)}`;

export const pageButtons = (
  page: SubmissionPage
): Array<{
  label: LocalizedText;
}> => page.buttons ?? (page.button?.enabled ? [{ label: page.button.label }] : []);

export const submissionSubtitle = (
  detail: SubmissionDetail,
  t: (key: "kind-update" | "kind-create" | "revision-heading" | "by-author", values?: Record<string, string | number>) => string
): string =>
  [
    detail.kind === "update" ? t("kind-update") : t("kind-create"),
    t("revision-heading", { number: detail.revision }),
    detail.author?.name ? t("by-author", { name: detail.author.name }) : null
  ]
    .filter(Boolean)
    .join(", ");
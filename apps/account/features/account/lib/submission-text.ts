import type { LocalizedText, SubmissionDetail, SubmissionPage, SubmissionStatus } from "@/features/account/lib/submission-api";
import { operatorNeedsValue } from "@nowly/presence-creator/creator-conditions";
import type { CreatorCondition, CreatorConditionAction, CreatorImage, CreatorLink, CreatorSmallImage } from "@nowly/presence-creator/creator-types";

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

const variableName = (page: SubmissionPage, id: string): string => page.variables?.find((variable) => variable.id === id)?.name ?? "?";

export const conditionRule = (page: SubmissionPage, condition: CreatorCondition): string => {
  const value = condition.operator === "between" ? `${condition.value} .. ${condition.valueMax}` : condition.value;

  return [
    variableName(page, condition.variableId),
    condition.operator,
    operatorNeedsValue(condition.operator) ? JSON.stringify(value) : ""
  ]
    .filter(Boolean)
    .join(" ");
};

const sourceDetail = (page: SubmissionPage, source: CreatorImage | CreatorSmallImage | CreatorLink): string => {
  if (source.kind === "custom") return source.template;
  if (source.kind === "variable") return `{${variableName(page, source.variableId)}}`;

  return source.kind;
};

const actionValue = (page: SubmissionPage, action: CreatorConditionAction, text: (value: LocalizedText) => string): string => {
  if ("text" in action) return text(action.text);
  if ("image" in action) return sourceDetail(page, action.image);
  if ("link" in action) return sourceDetail(page, action.link);
  if (action.kind === "activityType") return action.activityType;
  if (action.kind === "timestamps") return action.timestamps;

  return "";
};

export const conditionAction = (page: SubmissionPage, action: CreatorConditionAction, text: (value: LocalizedText) => string): string => {
  const button = "buttonId" in action ? `#${(page.buttons?.findIndex((entry) => entry.id === action.buttonId) ?? -1) + 1}` : "";

  return [
    action.kind,
    button,
    actionValue(page, action, text)
  ]
    .filter(Boolean)
    .join(" ");
};

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
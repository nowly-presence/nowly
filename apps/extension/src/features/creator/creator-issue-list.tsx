import { RiErrorWarningLine } from "@remixicon/react";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { FEATURE_MAX_LENGTH } from "@/shared/creator/creator-draft";
import { DESCRIPTION_MAX_LENGTH, LONG_DESCRIPTION_MAX_LENGTH, type CreatorIssue, type CreatorIssueCode } from "@/shared/creator/creator-validation";
import { longLocaleName } from "@/shared/locales";

const ISSUE_KEYS: Record<CreatorIssueCode, MessageKey> = {
  thumbnailMissing: "creator.issue.thumbnailMissing",
  thumbnailRights: "creator.issue.thumbnailRights",
  logoMissing: "creator.issue.logoMissing",
  iconMissing: "creator.issue.iconMissing",
  iconOpaque: "creator.issue.iconOpaque",
  nameMissing: "creator.issue.nameMissing",
  nameInvalid: "creator.issue.nameInvalid",
  nameTaken: "creator.issue.nameTaken",
  domainMissing: "creator.issue.domainMissing",
  domainInvalid: "creator.issue.domainInvalid",
  colorInvalid: "creator.issue.colorInvalid",
  englishRequired: "creator.issue.englishRequired",
  descriptionMissing: "creator.issue.descriptionMissing",
  descriptionTooLong: "creator.issue.descriptionTooLong",
  longDescriptionTooLong: "creator.issue.longDescriptionTooLong",
  featuresMissing: "creator.issue.featuresMissing",
  featureTooLong: "creator.issue.featureTooLong",
  pagesMissing: "creator.issue.pagesMissing",
  pageDetailsMissing: "creator.issue.pageDetailsMissing",
  pageUnknownVariable: "creator.issue.pageUnknownVariable",
  pageButtonLabelMissing: "creator.issue.pageButtonLabelMissing",
  pageButtonUrlInvalid: "creator.issue.pageButtonUrlInvalid",
  pageImageUrlInvalid: "creator.issue.pageImageUrlInvalid",
  pageCatchAllNotLast: "creator.issue.pageCatchAllNotLast"
};

const MAX_LENGTHS: Partial<Record<CreatorIssueCode, number>> = {
  descriptionTooLong: DESCRIPTION_MAX_LENGTH,
  longDescriptionTooLong: LONG_DESCRIPTION_MAX_LENGTH,
  featureTooLong: FEATURE_MAX_LENGTH
};

export const useIssueText = (showLanguage: boolean) => {
  const { t } = useI18n();
  return (issue: CreatorIssue): string => {
    const message = t(ISSUE_KEYS[issue.code], {
      page: issue.page || t("creator.untitled"),
      detail: issue.detail ?? "",
      max: MAX_LENGTHS[issue.code] ?? 0
    });
    return showLanguage && issue.locale
      ? t("creator.issue.withLanguage", {
          message,
          language: longLocaleName(issue.locale)
        })
      : message;
  };
};

type CreatorIssueListProps = {
  issues: CreatorIssue[];
  showLanguage: boolean;
  onSelect?: (issue: CreatorIssue) => void;
};

export const CreatorIssueList = ({ issues, showLanguage, onSelect }: CreatorIssueListProps) => {
  const text = useIssueText(showLanguage);

  if (issues.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1.5">
      {issues.map((issue, index) => (
        <li key={`${issue.code}-${issue.page ?? ""}-${issue.locale ?? ""}-${issue.detail ?? ""}-${index}`}>
          <button
            type="button"
            disabled={!onSelect}
            onClick={() => onSelect?.(issue)}
            className="flex w-full items-start gap-2 text-left text-label-md text-muted enabled:hover:text-ink"
          >
            <RiErrorWarningLine className="mt-0.5 size-4 shrink-0 text-danger" />
            <span>{text(issue)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};
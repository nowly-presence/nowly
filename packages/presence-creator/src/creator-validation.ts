import type { LocaleString as LongLocale } from "@nowly/locales";
import { imageVariableOf, isUrlTemplate, linkVariableOf, missingVariables } from "./creator-activity";
import { FEATURE_MAX_LENGTH, isValidDomain, isValidPresenceName, presenceSlug, textIn } from "./creator-draft";
import { writtenLocales } from "./creator-files";
import type { CreatorDraft, CreatorStep } from "./creator-types";

export const DESCRIPTION_MAX_LENGTH = 120;
export const LONG_DESCRIPTION_MAX_LENGTH = 600;

export type CreatorIssueCode =
  | "thumbnailMissing"
  | "thumbnailRights"
  | "logoMissing"
  | "iconMissing"
  | "iconOpaque"
  | "nameMissing"
  | "nameInvalid"
  | "nameTaken"
  | "domainMissing"
  | "domainInvalid"
  | "colorInvalid"
  | "englishRequired"
  | "descriptionMissing"
  | "descriptionTooLong"
  | "longDescriptionTooLong"
  | "featuresMissing"
  | "featureTooLong"
  | "pagesMissing"
  | "pageDetailsMissing"
  | "pageUnknownVariable"
  | "pageButtonLabelMissing"
  | "pageButtonUrlInvalid"
  | "pageImageUrlInvalid"
  | "pageCatchAllNotLast";

export type CreatorIssue = {
  step: CreatorStep;
  code: CreatorIssueCode;
  page?: string;
  locale?: LongLocale;
  detail?: string;
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const visualIssues = (draft: CreatorDraft): CreatorIssue[] => {
  const { assets } = draft;
  const issues: CreatorIssue[] = [];
  if (!assets.thumbnail)
    issues.push({
      step: "visuals",
      code: "thumbnailMissing"
    });
  else if (!assets.thumbnailRightsConfirmed) issues.push({
    step: "visuals",
    code: "thumbnailRights"
  });
  if (!assets.logo) issues.push({
    step: "visuals",
    code: "logoMissing"
  });
  if (!assets.icon)
    issues.push({
      step: "visuals",
      code: "iconMissing"
    });
  else if (assets.iconTransparent === false) issues.push({
    step: "visuals",
    code: "iconOpaque"
  });
  return issues;
};

const identityIssues = (draft: CreatorDraft, takenSlugs: ReadonlySet<string>): CreatorIssue[] => {
  const issues: CreatorIssue[] = [];
  const name = draft.name.trim();
  if (!name)
    issues.push({
      step: "identity",
      code: "nameMissing"
    });
  else if (!isValidPresenceName(name))
    issues.push({
      step: "identity",
      code: "nameInvalid"
    });
  else if (takenSlugs.has(presenceSlug(name))) issues.push({
    step: "identity",
    code: "nameTaken"
  });
  if (draft.domains.length === 0) issues.push({
    step: "identity",
    code: "domainMissing"
  });

  for (const domain of draft.domains.filter((value) => !isValidDomain(value)))
    issues.push({
      step: "identity",
      code: "domainInvalid",
      detail: domain
    });

  if (!HEX_COLOR.test(draft.color)) issues.push({
    step: "identity",
    code: "colorInvalid"
  });
  return issues;
};

const languageIssues = (draft: CreatorDraft): CreatorIssue[] =>
  draft.translationMode === "manual" && !writtenLocales(draft).includes("en-US")
    ? [
        {
          step: "language",
          code: "englishRequired"
        }
      ]
    : [];

const textIssues = (draft: CreatorDraft): CreatorIssue[] =>
  writtenLocales(draft).flatMap((locale) => {
    const issues: CreatorIssue[] = [];
    const description = textIn(draft.description, locale);
    if (!description)
      issues.push({
        step: "texts",
        code: "descriptionMissing",
        locale
      });
    else if (description.length > DESCRIPTION_MAX_LENGTH) issues.push({
      step: "texts",
      code: "descriptionTooLong",
      locale
    });
    if (textIn(draft.longDescription, locale).length > LONG_DESCRIPTION_MAX_LENGTH) issues.push({
      step: "texts",
      code: "longDescriptionTooLong",
      locale
    });
    if (!draft.features.some((feature) => textIn(feature, locale))) issues.push({
      step: "texts",
      code: "featuresMissing",
      locale
    });
    if (draft.features.some((feature) => textIn(feature, locale).length > FEATURE_MAX_LENGTH)) issues.push({
      step: "texts",
      code: "featureTooLong",
      locale
    });
    return issues;
  });

const pageIssues = (draft: CreatorDraft): CreatorIssue[] => {
  if (draft.pages.length === 0) return [
    {
      step: "pages",
      code: "pagesMissing"
    }
  ];

  const locales = writtenLocales(draft);
  return draft.pages.flatMap((page, index) => {
    const issues: CreatorIssue[] = [];
    const isCatchAll = page.match.mode === "any" || !page.match.path.trim();
    if (isCatchAll && index < draft.pages.length - 1) issues.push({
      step: "pages",
      code: "pageCatchAllNotLast",
      page: page.name
    });

    for (const button of page.buttons) {
      const { link } = button;

      if (link.kind === "custom" ? !isUrlTemplate(link.template) : link.kind === "variable" && !linkVariableOf(page, button)) {
        issues.push({
          step: "pages",
          code: "pageButtonUrlInvalid",
          page: page.name
        });
      }
    }

    const image = page.largeImage;

    if (image.kind === "custom" ? !isUrlTemplate(image.template) : image.kind === "variable" && !imageVariableOf(page)) {
      issues.push({
        step: "pages",
        code: "pageImageUrlInvalid",
        page: page.name
      });
    }

    const urlTemplates = [
      ...page.buttons.map((button) => (button.link.kind === "custom" ? button.link.template : "")),
      image.kind === "custom" ? image.template : ""
    ];

    for (const name of new Set(urlTemplates.flatMap((template) => missingVariables(template, page.variables)))) {
      issues.push({
        step: "pages",
        code: "pageUnknownVariable",
        page: page.name,
        detail: name
      });
    }

    for (const locale of locales) {
      const details = textIn(page.details, locale);
      if (!details) issues.push({
        step: "pages",
        code: "pageDetailsMissing",
        page: page.name,
        locale
      });

      for (const button of page.buttons) {
        if (!textIn(button.label, locale)) issues.push({
          step: "pages",
          code: "pageButtonLabelMissing",
          page: page.name,
          locale
        });
      }

      const templates = [
        details,
        textIn(page.state, locale),
        ...page.buttons.map((button) => textIn(button.label, locale))
      ];

      for (const name of new Set(templates.flatMap((template) => missingVariables(template, page.variables)))) {
        issues.push({
          step: "pages",
          code: "pageUnknownVariable",
          page: page.name,
          locale,
          detail: name
        });
      }
    }

    return issues;
  });
};

export const validateDraft = (draft: CreatorDraft, takenSlugs: ReadonlySet<string> = new Set()): CreatorIssue[] => [
  ...visualIssues(draft),
  ...identityIssues(draft, takenSlugs),
  ...languageIssues(draft),
  ...textIssues(draft),
  ...pageIssues(draft)
];

export const issuesForStep = (issues: CreatorIssue[], step: CreatorStep): CreatorIssue[] => issues.filter((issue) => issue.step === step);
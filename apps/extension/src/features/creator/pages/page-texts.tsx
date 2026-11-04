import { useMemo } from "react";
import { useI18n } from "@/hooks/i18n-provider";
import { isImageVariable } from "@nowly/presence-creator/creator-activity";
import { textIn } from "@nowly/presence-creator/creator-draft";
import { writtenLocales } from "@nowly/presence-creator/creator-files";
import type { CreatorDraft, CreatorPage, LocalizedText } from "@nowly/presence-creator/creator-types";
import { issuesForStep, validateDraft } from "@nowly/presence-creator/creator-validation";
import type { LongLocale } from "@/shared/locales";
import { Frame } from "@/ui/frame";
import { CreatorLocaleTabs, useEditLocale } from "@/features/creator/creator-locale-tabs";
import { TemplateFields } from "@/features/creator/pages/template-input";

const TEXT_MAX_LENGTH = 128;

const setText = (text: LocalizedText, locale: LongLocale, value: string): LocalizedText => ({
  ...text,
  [locale]: value
});

export const PageTexts = ({ draft, page, onChange }: {
  draft: CreatorDraft;
  page: CreatorPage;
  onChange: (page: CreatorPage) => void;
}) => {
  const { t } = useI18n();
  const base = draft.baseLocale;
  const locales = writtenLocales(draft);
  const [active, setLocale] = useEditLocale(`page:${page.id}`, locales, base);
  const incomplete = useMemo(() =>
    new Set(issuesForStep(validateDraft(draft), "pages").flatMap((issue) => (issue.page === page.name && issue.locale ? [issue.locale] : []))), [
    draft,
    page.name
  ]);
  const textVariables = page.variables.filter((variable) => !isImageVariable(variable));

  const example = textVariables[0] ? `{${textVariables[0].name}}` : draft.name.trim() || "Example";
  const placeholderFor = (text: LocalizedText, fallback: string) => (active !== base ? textIn(text, base) || fallback : fallback);

  return (
    <Frame title={t("creator.texts.discordTitle")} description={t("creator.texts.discordHint")}>
      <CreatorLocaleTabs locales={locales} value={active} base={base} onChange={setLocale} incomplete={incomplete} />
      <TemplateFields
        variables={textVariables}
        fields={[
          {
            id: "details",
            label: t("creator.texts.details"),
            value: page.details[active] ?? "",
            placeholder: placeholderFor(page.details, t("creator.texts.detailsPlaceholder", { example })),
            maxLength: TEXT_MAX_LENGTH,
            onChange: (value) =>
              onChange({
                ...page,
                details: setText(page.details, active, value)
              })
          },
          {
            id: "state",
            label: t("creator.texts.state"),
            optional: true,
            value: page.state[active] ?? "",
            placeholder: placeholderFor(page.state, t("creator.texts.statePlaceholder")),
            maxLength: TEXT_MAX_LENGTH,
            onChange: (value) =>
              onChange({
                ...page,
                state: setText(page.state, active, value)
              })
          }
        ]}
      />
    </Frame>
  );
};
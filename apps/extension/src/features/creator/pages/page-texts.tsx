import { useMemo } from "react";
import { useI18n } from "@/hooks/i18n-provider";
import { isImageVariable, isLinkVariable } from "@/shared/creator/creator-activity";
import { textIn } from "@/shared/creator/creator-draft";
import { writtenLocales } from "@/shared/creator/creator-files";
import type { CreatorDraft, CreatorLink, CreatorPage, LocalizedText } from "@/shared/creator/creator-types";
import { issuesForStep, validateDraft } from "@/shared/creator/creator-validation";
import type { LongLocale } from "@/shared/locales";
import { Switch } from "@/ui/switch";
import { CreatorLocaleTabs, useEditLocale } from "@/features/creator/creator-locale-tabs";
import { TemplateFields, TemplateInput } from "@/features/creator/pages/template-input";
import { UrlSourceField, type UrlSource } from "@/features/creator/pages/url-source-field";

const TEXT_MAX_LENGTH = 128;
const BUTTON_MAX_LENGTH = 32;

const setText = (text: LocalizedText, locale: LongLocale, value: string): LocalizedText => ({
  ...text,
  [locale]: value
});

const toUrlSource = (link: CreatorLink): UrlSource => (link.kind === "page" ? { kind: "default" } : link);

const toLink = (source: UrlSource): CreatorLink => (source.kind === "default" ? { kind: "page" } : source);

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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="text-label-lg font-medium">{t("creator.texts.discordTitle")}</span>
        <span className="text-label-md text-muted">{t("creator.texts.discordHint")}</span>
      </div>
      <CreatorLocaleTabs locales={locales} value={active} base={base} onChange={setLocale} incomplete={incomplete} />
      <TemplateFields
        framed
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-label-lg font-medium">{t("creator.texts.button")}</span>
          <span className="text-label-md text-muted">{t("creator.texts.buttonHint")}</span>
        </div>
        <Switch
          checked={page.button.enabled}
          label={t("creator.texts.button")}
          onChange={(enabled) =>
            onChange({
              ...page,
              button: { ...page.button, enabled }
            })
          }
        />
      </div>
      {page.button.enabled && (
        <div className="flex flex-col gap-5 rounded-md border border-line p-4">
          <TemplateInput
            label={t("creator.texts.buttonLabel")}
            value={page.button.label[active] ?? ""}
            placeholder={placeholderFor(page.button.label, t("creator.texts.buttonPlaceholder"))}
            maxLength={BUTTON_MAX_LENGTH}
            variables={textVariables}
            onChange={(value) =>
              onChange({
                ...page,
                button: {
                  ...page.button,
                  label: setText(page.button.label, active, value)
                }
              })
            }
          />
          <UrlSourceField
            read="link"
            label={t("creator.texts.buttonLink")}
            hint={t("creator.texts.buttonLinkHint")}
            defaultLabel={t("creator.texts.buttonLinkPage")}
            value={toUrlSource(page.button.link)}
            page={page}
            candidates={page.variables.filter(isLinkVariable)}
            onChange={(next, source) =>
              onChange({
                ...next,
                button: {
                  ...next.button,
                  link: toLink(source)
                }
              })
            }
          />
        </div>
      )}
    </div>
  );
};
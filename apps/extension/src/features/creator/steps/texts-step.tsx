import { useMemo } from "react";
import { RiAddLine, RiCloseLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { FEATURE_MAX_LENGTH, FEATURES_MAX, textIn } from "@nowly/presence-creator/creator-draft";
import { writtenLocales } from "@nowly/presence-creator/creator-files";
import type { CreatorDraft, LocalizedText } from "@nowly/presence-creator/creator-types";
import { DESCRIPTION_MAX_LENGTH, issuesForStep, LONG_DESCRIPTION_MAX_LENGTH, validateDraft } from "@nowly/presence-creator/creator-validation";
import type { LongLocale } from "@/shared/locales";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { InputGroup, InputGroupCounter, InputGroupInput } from "@/ui/input-group";
import { Textarea } from "@/ui/textarea";
import { CreatorLocaleTabs, useEditLocale } from "@/features/creator/creator-locale-tabs";
import type { DraftUpdate } from "@/features/creator/use-draft-editor";

const setText = (text: LocalizedText, locale: LongLocale, value: string): LocalizedText => ({
  ...text,
  [locale]: value
});

export const TextsStep = ({ draft, update }: {
  draft: CreatorDraft;
  update: DraftUpdate;
}) => {
  const { t } = useI18n();
  const base = draft.baseLocale;
  const locales = writtenLocales(draft);
  const [active, setLocale] = useEditLocale("texts", locales, base);
  const incomplete = useMemo(() => new Set(issuesForStep(validateDraft(draft), "texts").flatMap((issue) => (issue.locale ? [issue.locale] : []))), [draft]);
  const translating = active !== base;
  const hintFor = (text: LocalizedText, fallback: string) => (translating ? textIn(text, base) || fallback : fallback);
  const description = draft.description[active] ?? "";
  const longDescription = draft.longDescription[active] ?? "";
  const name = draft.name.trim() || "Example";

  return (
    <div className="flex flex-col gap-6">
      <CreatorLocaleTabs locales={locales} value={active} base={base} onChange={setLocale} incomplete={incomplete} />
      {draft.translationMode === "auto" && <p className="rounded-md bg-primary-soft px-3 py-2.5 text-label-md text-primary">{t("creator.texts.autoNotice")}</p>}

      <Field label={t("creator.texts.short")} hint={t("creator.texts.descriptionHint")} invalid={description.length > DESCRIPTION_MAX_LENGTH}>
        <InputGroup>
          <InputGroupInput
            value={description}
            onChange={(event) =>
              update((current) => ({
                ...current,
                description: setText(current.description, active, event.target.value)
              }))
            }
            placeholder={hintFor(draft.description, t("creator.texts.descriptionPlaceholder", { name }))}
          />
          <InputGroupCounter length={description.length} max={DESCRIPTION_MAX_LENGTH} />
        </InputGroup>
      </Field>

      <Field
        label={t("creator.texts.longDescription")}
        hint={t("creator.texts.longDescriptionHint")}
        optional={t("creator.texts.optional")}
        invalid={longDescription.length > LONG_DESCRIPTION_MAX_LENGTH}
        action={
          <span
            className={
              longDescription.length > LONG_DESCRIPTION_MAX_LENGTH ? "text-label-sm text-danger tabular-nums" : "text-label-sm text-muted tabular-nums"
            }
          >
            {longDescription.length}/{LONG_DESCRIPTION_MAX_LENGTH}
          </span>
        }
      >
        <Textarea
          rows={4}
          value={longDescription}
          onChange={(event) =>
            update((current) => ({
              ...current,
              longDescription: setText(current.longDescription, active, event.target.value)
            }))
          }
          placeholder={hintFor(draft.longDescription, t("creator.texts.longDescriptionPlaceholder", { name }))}
        />
      </Field>

      <Field label={t("creator.texts.features")} hint={t("creator.texts.featuresHint", { max: FEATURES_MAX })}>
        <div className="flex flex-col gap-2">
          {draft.features.map((feature, index) => {
            const value = feature[active] ?? "";
            return (
              <div key={index} className="flex gap-2">
                <InputGroup className="flex-1">
                  <InputGroupInput
                    aria-label={t("creator.texts.featureLabel", { index: index + 1 })}
                    value={value}
                    maxLength={FEATURE_MAX_LENGTH}
                    placeholder={hintFor(feature, t(index === 0 ? "creator.texts.featurePlaceholder" : "creator.texts.featurePlaceholderMore"))}
                    onChange={(event) =>
                      update((current) => ({
                        ...current,
                        features: current.features.map((item, position) => (position === index ? setText(item, active, event.target.value) : item))
                      }))
                    }
                  />
                  <InputGroupCounter length={value.length} max={FEATURE_MAX_LENGTH} />
                </InputGroup>
                {draft.features.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("creator.texts.removeFeature", { index: index + 1 })}
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        features: current.features.filter((_, position) => position !== index)
                      }))
                    }
                  >
                    <RiCloseLine className="size-4" />
                  </Button>
                )}
              </div>
            );
          })}
          {draft.features.length < FEATURES_MAX && (
            <Button
              variant="link"
              className="self-start"
              icon={<RiAddLine className="size-3.5" />}
              onClick={() =>
                update((current) => ({
                  ...current,
                  features: [
                    ...current.features,
                    {}
                  ]
                }))
              }
            >
              {t("creator.texts.addFeature")}
            </Button>
          )}
        </div>
      </Field>
    </div>
  );
};
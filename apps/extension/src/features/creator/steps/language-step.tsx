import { RiMagicLine, RiTranslate2 } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { isLongLocale, longLocaleName, PRESENCE_LOCALES, type LongLocale } from "@/shared/locales";
import type { CreatorDraft, CreatorTranslationMode } from "@nowly/presence-creator/creator-types";
import { ChoiceCard } from "@/ui/choice-card";
import { Chip } from "@/ui/chip";
import { LocaleFlag } from "@/ui/locale-flag";
import { Select } from "@/ui/select";
import { Field } from "@/ui/field";
import type { DraftUpdate } from "@/features/creator/use-draft-editor";

const withEnglish = (locales: LongLocale[]): LongLocale[] => (locales.includes("en-US") ? locales : [...locales, "en-US"]);

export const LanguageStep = ({ draft, update }: {
  draft: CreatorDraft;
  update: DraftUpdate;
}) => {
  const { t } = useI18n();
  const baseName = longLocaleName(draft.baseLocale);

  const setMode = (mode: CreatorTranslationMode) =>
    update((current) => ({
      ...current,
      translationMode: mode,
      locales: mode === "manual" ? withEnglish([current.baseLocale, ...current.locales]) : [current.baseLocale]
    }));

  const setBase = (locale: LongLocale) =>
    update((current) => {
      const locales = current.translationMode === "manual" ? withEnglish([locale, ...current.locales.filter((value) => value !== locale)]) : [locale];
      return {
        ...current,
        baseLocale: locale,
        locales
      };
    });

  const toggleLocale = (locale: LongLocale) =>
    update((current) => ({
      ...current,
      locales: current.locales.includes(locale) ? current.locales.filter((value) => value !== locale) : [...current.locales, locale]
    }));

  return (
    <div className="flex flex-col gap-6">
      <Field label={t("creator.language.base")} hint={t("creator.language.baseHint")}>
        <Select
          aria-label={t("creator.language.base")}
          value={draft.baseLocale}
          onChange={(value) => {
            if (isLongLocale(value)) setBase(value);
          }}
          options={PRESENCE_LOCALES.map((code) => ({
            value: code,
            label: longLocaleName(code),
            icon: <LocaleFlag locale={code} />
          }))}
        />
      </Field>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label={t("creator.language.mode")}>
        <span className="text-label-lg font-medium">{t("creator.language.mode")}</span>
        <ChoiceCard
          selected={draft.translationMode === "auto"}
          onSelect={() => setMode("auto")}
          icon={<RiMagicLine className="size-4" />}
          title={t("creator.language.auto")}
          description={t("creator.language.autoHint", { language: baseName })}
        />
        <ChoiceCard
          selected={draft.translationMode === "manual"}
          onSelect={() => setMode("manual")}
          icon={<RiTranslate2 className="size-4" />}
          title={t("creator.language.manual")}
          description={t("creator.language.manualHint")}
        />
      </div>

      {draft.translationMode === "manual" && (
        <Field label={t("creator.language.locales")} hint={t("creator.language.localesHint")}>
          <div className="flex flex-wrap gap-2">
            {PRESENCE_LOCALES.map((code) => {
              const locked = code === draft.baseLocale || code === "en-US";
              return (
                <Chip
                  key={code}
                  active={draft.locales.includes(code) || locked}
                  disabled={locked}
                  onClick={() => toggleLocale(code)}
                  icon={<LocaleFlag locale={code} className="size-3.5" />}
                >
                  {longLocaleName(code)}
                </Chip>
              );
            })}
          </div>
        </Field>
      )}
    </div>
  );
};
import { useMemo } from "react"
import { RiGlobalLine, RiTranslate2 } from "@remixicon/react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { track } from "@/lib/messages"
import { commonPresenceLocales } from "@/lib/presence-locales"
import { isLocale, isLongLocale, LOCALE_LONG_MAP, LOCALE_NAMES, longLocaleName, PRESENCE_LOCALES, UI_LOCALES } from "@/shared/locales"
import type { AppearanceMode } from "@/shared/types"
import { Group } from "@/ui/card"
import { FieldRow } from "@/ui/field-row"
import { LocaleFlag } from "@/ui/locale-flag"
import { SwitchRow } from "@/ui/row"
import { Section } from "@/ui/section"
import { Segmented } from "@/ui/segmented"
import { Select, type SelectOption } from "@/ui/select"

const PER_PRESENCE = "per-presence"

const optionIconClass = "size-4 shrink-0 text-muted"

export const AppearanceSection = () => {
  const { state, updateSettings } = useExtensionState()
  const { t, preference, setPreference } = useI18n()
  const { settings } = state
  const presenceLanguage = settings.presenceLanguage ?? PER_PRESENCE
  const common = useMemo(() => commonPresenceLocales(state.presences), [state.presences])
  const restricted = common.length < PRESENCE_LOCALES.length

  const presenceLanguageOptions: SelectOption[] = [
    { value: PER_PRESENCE, label: t("settings.perPresence"), icon: <RiTranslate2 className={optionIconClass} /> },
    ...PRESENCE_LOCALES.filter((code) => common.includes(code) || code === presenceLanguage).map((code) => ({
      value: code,
      label: longLocaleName(code),
      hint: common.includes(code) ? undefined : t("settings.presenceLanguagePartial"),
      icon: <LocaleFlag locale={code} />,
    })),
  ]

  return (
    <Section title={t("settings.appearance")}>
      <Group>
        <FieldRow title={t("settings.theme")} layout="stacked">
          <Segmented<AppearanceMode>
            label={t("settings.theme")}
            value={settings.appearance ?? "system"}
            onChange={(value) => void updateSettings({ appearance: value })}
            options={[
              { value: "system", label: t("settings.themeSystem") },
              { value: "light", label: t("settings.themeLight") },
              { value: "dark", label: t("settings.themeDark") },
            ]}
          />
        </FieldRow>
        <SwitchRow
          title={t("settings.seasonalThemes")}
          description={t("settings.seasonalThemesHint")}
          checked={settings.seasonalThemes !== false}
          label={t("settings.seasonalThemes")}
          onChange={(checked) => void updateSettings({ seasonalThemes: checked })}
        />
        <FieldRow title={t("settings.language")} controlClassName="w-44">
          <Select
            aria-label={t("settings.language")}
            value={preference}
            onChange={(value) => {
              setPreference(isLocale(value) ? value : "browser")
              track("settings_language_changed")
            }}
            options={[
              { value: "browser", label: t("settings.languageBrowser"), icon: <RiGlobalLine className={optionIconClass} /> },
              ...UI_LOCALES.map((code) => ({ value: code, label: LOCALE_NAMES[code], icon: <LocaleFlag locale={LOCALE_LONG_MAP[code]} /> })),
            ]}
          />
        </FieldRow>
        <FieldRow
          title={t("settings.presenceLanguage")}
          description={t("settings.presenceLanguageHint")}
          note={restricted ? t("settings.presenceLanguageNote", { perPresence: t("settings.perPresence") }) : undefined}
          controlClassName="w-44"
        >
          <Select
            aria-label={t("settings.presenceLanguage")}
            value={presenceLanguage}
            onChange={(value) => {
              if (value === PER_PRESENCE || isLongLocale(value)) void updateSettings({ presenceLanguage: value })
            }}
            options={presenceLanguageOptions}
          />
        </FieldRow>
      </Group>
    </Section>
  )
}

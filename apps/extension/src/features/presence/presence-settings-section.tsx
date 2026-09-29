import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { sendMessage } from "@/lib/messages"
import { presenceLocalesOf } from "@/lib/presence-locales"
import type { PresenceView } from "@/lib/presence-view"
import { isLongLocale, longLocaleName } from "@/shared/locales"
import { configuredPresenceLocale } from "@/shared/presence-language"
import { Group } from "@/ui/card"
import { FieldRow } from "@/ui/field-row"
import { LocaleFlag } from "@/ui/locale-flag"
import { Section } from "@/ui/section"
import { Select } from "@/ui/select"
import { normalizeDefinitions, PresenceSettingsList } from "@/features/presence/presence-settings-fields"

export const PresenceSettingsSection = ({ view }: { view: PresenceView }) => {
  const { state, refresh, updateSettings } = useExtensionState()
  const { t, locale } = useI18n()
  const definitions = normalizeDefinitions(view.settings)
  const locales = presenceLocalesOf(view.locales)
  const perPresenceLanguage = !state.settings.presenceLanguage || state.settings.presenceLanguage === "per-presence"
  const showLanguage = locales.length > 1 && perPresenceLanguage

  if (definitions.length === 0 && !showLanguage) return null

  const currentLanguage = configuredPresenceLocale(state.settings, view.slug, view.locales, locale)

  const changeSetting = async (key: string, value: unknown) => {
    await sendMessage("SET_PRESENCE_SETTINGS", { slug: view.slug, partial: { [key]: value } })
    await refresh.presenceSettings()
  }

  return (
    <Section title={t("detail.settings")}>
      <Group>
        <PresenceSettingsList definitions={definitions} values={state.presenceSettings[view.slug] ?? {}} onChange={(key, value) => void changeSetting(key, value)} />
        {showLanguage && (
          <FieldRow title={t("detail.language")} description={t("detail.languageHint")} controlClassName="w-44">
            <Select
              aria-label={t("detail.language")}
              value={currentLanguage}
              onChange={(value) => {
                if (isLongLocale(value)) void updateSettings({ presenceLanguages: { ...(state.settings.presenceLanguages ?? {}), [view.slug]: value } })
              }}
              options={locales.map((code) => ({ value: code, label: longLocaleName(code), icon: <LocaleFlag locale={code} /> }))}
            />
          </FieldRow>
        )}
      </Group>
    </Section>
  )
}

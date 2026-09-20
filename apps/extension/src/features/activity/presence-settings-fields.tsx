import { Fragment, useCallback, useEffect, useState } from "react"
import { LocaleFlag } from "@/components/shared/locale-flag"
import { localeLabel, resolveLocaleString } from "@/features/activity/presence-locale"
import { SettingRow } from "@/features/settings/setting-row"
import { sendMessage } from "@/lib/messages"
import { t } from "@/shared/i18n"
import type { ExtensionSettings, PresenceLocale } from "@/shared/types"
import { Input } from "@/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Slider } from "@/ui/slider"
import { Switch } from "@/ui/switch"

type SettingDefinition = Record<string, unknown> & { default?: unknown; description?: unknown; type?: string }

type Props = {
  definitions: Record<string, unknown>
  locales?: Record<string, Record<string, string>>
  slug: string
}

const inferType = (value: unknown): string => {
  if (typeof value === "boolean") return "boolean"
  if (typeof value === "string") return "input"
  if (typeof value === "number") return "slider"
  return "unknown"
}

export const PresenceSettingsFields = ({ definitions, locales, slug }: Props): React.JSX.Element | null => {
  const [values, setValues] = useState<Record<string, unknown>>({})

  const [loaded, setLoaded] = useState(false)

  const [extensionSettings, setExtensionSettings] = useState<ExtensionSettings | null>(null)

  useEffect(() => {
    if (!definitions) return
    Promise.all([sendMessage("GET_PRESENCE_SETTINGS"), sendMessage("GET_SETTINGS")]).then(([all, currentExtensionSettings]) => {
      const saved = all[slug] ?? {}
      const defaults: Record<string, unknown> = {}
      for (const [key, def] of Object.entries(definitions)) {
        defaults[key] = typeof def === "object" && def !== null && "default" in def ? (def as SettingDefinition).default : def
      }
      setValues({ ...defaults, ...saved })
      setLoaded(true)
      setExtensionSettings(currentExtensionSettings)
    })
  }, [slug, definitions])

  useEffect(() => {
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string): void => {
      if (area === "local" && changes.settings?.newValue) setExtensionSettings(changes.settings.newValue as ExtensionSettings)
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  const handleChange = useCallback(
    (key: string, value: unknown): void => {
      setValues((prev) => ({ ...prev, [key]: value }))
      void sendMessage("SET_PRESENCE_SETTINGS", { slug, partial: { [key]: value } })
    },
    [slug],
  )

  if (!loaded || !definitions) return null

  const settingKeys = Object.entries(definitions)

  const showLanguage = Boolean(locales && (extensionSettings?.presenceLanguage ?? "per-presence") === "per-presence")
  const presenceLocale = extensionSettings?.presenceLanguages?.[slug] ?? "en-US"

  if (!showLanguage && settingKeys.length === 0) return null

  const handleLanguageChange = (locale: PresenceLocale): void => {
    if (!extensionSettings) return
    void sendMessage("SET_SETTINGS", { presenceLanguages: { ...(extensionSettings.presenceLanguages ?? {}), [slug]: locale } })
  }

  return (
    <>
      {showLanguage ? (
        <SettingRow
          title={t("presence-language-this")}
          controlId="presence-language-this-select"
          control={
            <Select
              value={presenceLocale}
              onValueChange={(value) => handleLanguageChange(value as PresenceLocale)}
              items={Object.fromEntries(
                Object.keys(locales ?? {}).map((locale) => [
                  locale,
                  <Fragment key={locale}>
                    <LocaleFlag locale={locale} />
                    {localeLabel(locale)}
                  </Fragment>,
                ]),
              )}
            >
              <SelectTrigger
                id="presence-language-this-select"
                size="sm"
                className="w-36"
                aria-label={t("presence-language-this")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(locales ?? {}).map((locale) => (
                  <SelectItem
                    key={locale}
                    value={locale}
                  >
                    <LocaleFlag locale={locale} />
                    {localeLabel(locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      ) : null}
      {settingKeys.map(([key, def]) => {
        const defObj = typeof def === "object" && def !== null ? (def as SettingDefinition) : null
        const type = defObj?.type ?? inferType(def)
        const label = defObj?.label ? (resolveLocaleString(defObj.label) ?? key) : key
        const description = resolveLocaleString(defObj?.description)
        const placeholder = resolveLocaleString(defObj?.placeholder)
        const value = values[key]
        const controlId = `field-${slug}-${key}`

        if (type === "boolean") {
          return (
            <SettingRow
              key={key}
              title={label}
              description={description}
              controlId={controlId}
              control={
                <Switch
                  id={controlId}
                  checked={Boolean(value)}
                  onCheckedChange={(v) => handleChange(key, v)}
                />
              }
            />
          )
        }

        if (type === "input") {
          return (
            <SettingRow
              key={key}
              title={label}
              description={description}
              controlId={controlId}
            >
              <Input
                id={controlId}
                type="text"
                value={String(value ?? "")}
                placeholder={placeholder ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full"
              />
            </SettingRow>
          )
        }

        if (type === "select") {
          const options = (defObj?.options as Array<Record<string, unknown>> | undefined) ?? []
          const items = Object.fromEntries(
            options.map((opt) => {
              const optValue = String(opt?.value ?? "")
              return [optValue, resolveLocaleString(opt?.label) ?? (opt?.label != null ? String(opt.label) : optValue)]
            }),
          )
          return (
            <SettingRow
              key={key}
              title={label}
              description={description}
              controlId={controlId}
            >
              <Select
                value={String(value ?? "")}
                onValueChange={(v) => handleChange(key, v)}
                items={items}
              >
                <SelectTrigger
                  size="sm"
                  className="w-full"
                  id={controlId}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => {
                    const optValue = String(opt?.value ?? "")
                    return (
                      <SelectItem
                        key={optValue}
                        value={optValue}
                      >
                        {items[optValue]}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </SettingRow>
          )
        }

        return (
          <SettingRow
            key={key}
            title={label}
            description={description}
            controlId={controlId}
          >
            <div className="flex w-full items-center gap-2">
              <Slider
                id={controlId}
                min={defObj?.min !== undefined ? Number(defObj.min) : 0}
                max={defObj?.max !== undefined ? Number(defObj.max) : 100}
                step={defObj?.step !== undefined ? Number(defObj.step) : 1}
                value={[Number(value ?? 0)]}
                onValueChange={(next) => handleChange(key, Array.isArray(next) ? next[0] : next)}
              />
              <span className="w-8 text-right text-sm text-muted-foreground">{String(value ?? 0)}</span>
            </div>
          </SettingRow>
        )
      })}
    </>
  )
}

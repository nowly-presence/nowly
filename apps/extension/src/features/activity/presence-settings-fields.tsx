import { useCallback, useEffect, useState } from "react"
import { LocaleFlag } from "@/components/shared/locale-flag"
import { localeLabel, resolveLocaleString } from "@/features/activity/presence-locale"
import { sendMessage } from "@/lib/messages"
import { t } from "@/shared/i18n"
import type { ExtensionSettings, PresenceLocale } from "@/shared/types"
import { Input } from "@/ui/input"
import { Label } from "@/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Slider } from "@/ui/slider"
import { Switch } from "@/ui/switch"

type SettingDefinition = Record<string, unknown> & { default?: unknown; type?: string }

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
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Label className="text-sm text-foreground">{t("presence-language-this")}</Label>
          <Select value={presenceLocale} onValueChange={(value) => handleLanguageChange(value as PresenceLocale)}>
            <SelectTrigger size="sm" className="w-36" aria-label={t("presence-language-this")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(locales ?? {}).map((locale) => (
                <SelectItem key={locale} value={locale}>
                  <LocaleFlag locale={locale} />
                  {localeLabel(locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {settingKeys.map(([key, def]) => {
        const defObj = typeof def === "object" && def !== null ? (def as SettingDefinition) : null
        const type = defObj?.type ?? inferType(def)
        const label = defObj?.label ? (resolveLocaleString(defObj.label) ?? key) : key
        const placeholder = resolveLocaleString(defObj?.placeholder)
        const value = values[key]
        const fieldId = `field-${slug}-${key}`

        return (
          <div key={key} className="flex items-center justify-between gap-3 px-4 py-3">
            <Label htmlFor={fieldId} className="cursor-pointer text-sm text-foreground">
              {label}
            </Label>

            {type === "boolean" ? <Switch id={fieldId} checked={Boolean(value)} onCheckedChange={(v) => handleChange(key, v)} /> : null}

            {type === "input" ? (
              <Input id={fieldId} type="text" value={String(value ?? "")} placeholder={placeholder ?? ""} onChange={(e) => handleChange(key, e.target.value)} className="w-44" />
            ) : null}

            {type === "select" ? (
              <Select value={String(value ?? "")} onValueChange={(v) => handleChange(key, v)}>
                <SelectTrigger size="sm" className="w-44" id={fieldId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(defObj?.options as Array<Record<string, unknown>> | undefined)?.map((opt) => {
                    const optValue = String(opt?.value ?? "")
                    const optionLabel = resolveLocaleString(opt?.label) ?? (opt?.label != null ? String(opt.label) : optValue)
                    return (
                      <SelectItem key={optValue} value={optValue}>
                        {optionLabel}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            ) : null}

            {type === "slider" ? (
              <div className="flex w-44 items-center gap-2">
                <Slider
                  id={fieldId}
                  min={defObj?.min !== undefined ? Number(defObj.min) : 0}
                  max={defObj?.max !== undefined ? Number(defObj.max) : 100}
                  step={defObj?.step !== undefined ? Number(defObj.step) : 1}
                  value={[Number(value ?? 0)]}
                  onValueChange={(next) => handleChange(key, Array.isArray(next) ? next[0] : next)}
                />
                <span className="w-8 text-right text-sm text-muted-foreground">{String(value ?? 0)}</span>
              </div>
            ) : null}
          </div>
        )
      })}
    </>
  )
}

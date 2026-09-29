import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import de from "@messages/de.json"
import el from "@messages/el.json"
import en from "@messages/en.json"
import es from "@messages/es.json"
import fr from "@messages/fr.json"
import ja from "@messages/ja.json"
import ko from "@messages/ko.json"
import ms from "@messages/ms.json"
import pl from "@messages/pl.json"
import ptBR from "@messages/pt-BR.json"
import tr from "@messages/tr.json"
import {
  isLocale,
  LOCALE_PREFERENCE_KEY,
  resolveLocale,
  type Locale,
  type LocalePreference,
} from "@/shared/locales"

export type MessageKey = keyof typeof en

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, fr, es, de, "pt-BR": ptBR, pl, ja, ko, tr, ms, el }

export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string

type I18nValue = {
  locale: Locale
  preference: LocalePreference
  setPreference: (preference: LocalePreference) => void
  t: Translate
}

const I18nContext = createContext<I18nValue | null>(null)

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [preference, setPreferenceState] = useState<LocalePreference>("browser")

  useEffect(() => {
    void chrome.storage.local.get(LOCALE_PREFERENCE_KEY).then((result) => {
      const value = result[LOCALE_PREFERENCE_KEY]
      setPreferenceState(isLocale(value) ? value : "browser")
    })
  }, [])

  const locale = resolveLocale(preference)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setPreference = useCallback((next: LocalePreference) => {
    setPreferenceState(next)
    void chrome.storage.local.set({ [LOCALE_PREFERENCE_KEY]: next })
  }, [])

  const t = useCallback<Translate>(
    (key, params) => {
      let value = dictionaries[locale][key] ?? en[key] ?? key
      if (params) for (const [name, replacement] of Object.entries(params)) value = value.replaceAll(`{${name}}`, String(replacement))
      return value
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, preference, setPreference, t }), [locale, preference, setPreference, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = (): I18nValue => {
  const value = useContext(I18nContext)
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>")
  return value
}

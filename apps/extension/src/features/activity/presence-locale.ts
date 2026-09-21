import { getLocale, t } from "@/shared/i18n"

const localeKeyMap: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
}

const localeLabelKeys = {
  "en-US": "locale-en",
  "fr-FR": "locale-fr",
  "es-ES": "locale-es",
} as const

export const localeLabel = (locale: string): string => {
  const key = localeLabelKeys[locale as keyof typeof localeLabelKeys]
  return key ? t(key) : locale
}

export const resolveLocaleString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value
  if (typeof value === "object" && value !== null) {
    const map = value as Record<string, string>
    const locale = getLocale()
    return map[localeKeyMap[locale]] ?? map["en-US"] ?? Object.values(map)[0]
  }
  return undefined
}

export const resolveLocaleList = (value: unknown): string[] => {
  if (!value || typeof value !== "object") return []
  const map = value as Record<string, unknown>
  const locale = getLocale()
  const candidates = [map[localeKeyMap[locale]], map["en-US"], ...Object.values(map)]

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.every((item) => typeof item === "string")) {
      return candidate
    }
  }

  return []
}

import { LOCALE_LONG_MAP } from "@nowly/locales"
import { resolveLocale, type LocalePreference } from "@/shared/i18n"

export const marketplaceLocale = (preference: LocalePreference): string => LOCALE_LONG_MAP[resolveLocale(preference)]

export const requestUserScriptsPermission = (): void => {
  void chrome.permissions.request({ permissions: ["userScripts"] }).catch(() => {
    // Declined or unavailable: the step stays until the permission is granted.
  })
}

export const stepDotClass = (active: boolean, done: boolean): string => {
  if (active) return "w-5 bg-accent"
  if (done) return "w-1.5 bg-success"
  return "w-1.5 bg-muted-foreground/40"
}

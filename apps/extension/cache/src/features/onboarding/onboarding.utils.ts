import { resolveLocale, type LocalePreference } from "@/shared/i18n";

export const marketplaceLocale = (preference: LocalePreference): string => {
  const locale = resolveLocale(preference);
  if (locale === "fr") return "fr-FR";
  if (locale === "es") return "es-ES";
  return "en-US";
};

export const requestUserScriptsPermission = (): void => {
  void chrome.permissions.request({ permissions: ["userScripts"] }).catch(() => {
    // Declined or unavailable: the step stays until the permission is granted.
  });
};

export const stepDotClass = (active: boolean, done: boolean): string => {
  if (active) return "w-5 bg-accent";
  if (done) return "w-1.5 bg-success";
  return "w-1.5 bg-dim-foreground";
};
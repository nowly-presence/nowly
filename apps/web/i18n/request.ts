import { FALLBACK_LOCALE, isValidLocale, type LocaleString } from "@nowly/locales";
import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

const parseAcceptLanguage = (acceptLanguage: string | null): LocaleString | null => {
  if (!acceptLanguage) return null;

  const locales = acceptLanguage
    .split(",")
    .map((entry) => {
      const [lang, q = "q=1"] = entry.trim().split(";");
      return { lang: lang.trim(), q: parseFloat(q.split("=")[1] || "1") };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of locales) {
    const normalized = lang.replace("_", "-");
    if (isValidLocale(normalized)) return normalized;

    const langPrefix = lang.split("-")[0].toLowerCase();
    if (langPrefix === "en") return "en-US";
    if (langPrefix === "fr") return "fr-FR";
    if (langPrefix === "es") return "es-ES";
  }

  return null;
};

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("locale")?.value;
  const headersList = await headers();
  const detected = parseAcceptLanguage(headersList.get("accept-language"));
  const locale: LocaleString = isValidLocale(cookieLocale ?? "")
    ? (cookieLocale as LocaleString)
    : (detected ?? FALLBACK_LOCALE);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

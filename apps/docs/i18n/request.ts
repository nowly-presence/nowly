import { SUPPORTED_LOCALES, type LocaleString as Locale } from "@nowly/locales";
import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

const parseAcceptLanguage = (acceptLanguage: string | null): Locale | null => {
  if (!acceptLanguage) return null;

  const locales = acceptLanguage
    .split(",")
    .map((entry) => {
      const [lang, q = "q=1"] = entry.trim().split(";");
      return { lang: lang.trim(), q: parseFloat(q.split("=")[1] || "1") };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of locales) {
    const normalized = lang.replace("-", "_").toLowerCase();
    const match = SUPPORTED_LOCALES.find(
      (s) => s.toLowerCase() === normalized || s.split("-")[0].toLowerCase() === normalized
    );
    if (match) return match;

    const langPrefix = lang.split("-")[0].toLowerCase();
    const matchByPrefix = SUPPORTED_LOCALES.find(
      (s) => s.split("-")[0].toLowerCase() === langPrefix
    );
    if (matchByPrefix) return matchByPrefix;
  }

  return null;
};

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("locale")?.value as Locale | undefined;

  if (cookieLocale) {
    return {
      locale: cookieLocale,
      messages: (await import(`../messages/${cookieLocale}.json`)).default,
    };
  }

  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  const detected = parseAcceptLanguage(acceptLanguage);

  const locale = detected ?? "en-US";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
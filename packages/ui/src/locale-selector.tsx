"use client";

import { LocaleFlag } from "./locale-flag";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./select";

import { SUPPORTED_LOCALES, type LocaleString } from "@nowly/locales";
import { usePathname, useRouter } from "@nowly/locales/navigation";
import { useLocale, useTranslations } from "next-intl";

const localeLabelKey: Record<LocaleString, string> = {
  "en-US": "english",
  "fr-FR": "french",
  "es-ES": "spanish",
  "de-DE": "german",
  "pt-BR": "portuguese",
  "pl-PL": "polish",
  "ja-JP": "japanese",
  "ko-KR": "korean",
  "tr-TR": "turkish",
  "ms-MY": "malay",
  "el-GR": "greek",
};

export const LocaleSelector = () => {
  const locale = useLocale() as LocaleString;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("footer");

  const items = SUPPORTED_LOCALES.map((code) => ({
    value: code,
    label: t(localeLabelKey[code]),
  }));

  return (
    <Select
      items={items}
      value={locale}
      onValueChange={(value) => {
        if (!value) {
          return;
        }

        router.replace(pathname, { locale: value as LocaleString });
      }}
    >
      <SelectTrigger className="min-w-[148px]" aria-label={t("language-label")}>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <LocaleFlag locale={locale} />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              <LocaleFlag locale={item.value} />
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

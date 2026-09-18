"use client";

import { LocaleFlag } from "@/components/locale-flag";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@nowly/ui";

import { SUPPORTED_LOCALES, type LocaleString } from "@nowly/locales";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

const localeLabelKey: Record<LocaleString, "english" | "french" | "spanish"> = {
  "en-US": "english",
  "fr-FR": "french",
  "es-ES": "spanish",
};

export const LocaleSelector = () => {
  const locale = useLocale() as LocaleString;
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

        document.cookie = `locale=${value};path=/;max-age=31536000;SameSite=Lax`;
        router.refresh();
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

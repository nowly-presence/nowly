"use client";

import { LocaleFlag } from "@/components/locale-flag";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nowly/ui";

import { SUPPORTED_LOCALES, type LocaleString } from "@nowly/locales";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { FC } from "react";

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

export const LocaleSelector: FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("footer");

  const handleLocaleChange = (value: string | null): void => {
    if (!value) return;
    document.cookie = `locale=${value};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="flex justify-start">
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger
          size="sm"
          className="h-9 min-w-[148px] rounded-[10px] border-input bg-transparent text-foreground hover:border-border-light hover:bg-foreground/6"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LOCALES.map((code) => (
            <SelectItem key={code} value={code}>
              <span className="inline-flex size-4 shrink-0 overflow-hidden [&>svg]:size-full">
                <LocaleFlag locale={code} />
              </span>
              {t(localeLabelKey[code])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

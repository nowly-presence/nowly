"use client";

import { LocaleFlag } from "@/components/locale-flag";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LOCALES, type LocaleString } from "@nowly/locales";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { FC } from "react";

const localeLabelKey: Record<LocaleString, string> = {
  "en-US": "english",
  "fr-FR": "french",
  "es-ES": "spanish",
};

export const LocaleSelector: FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("footer");

  const handleLocaleChange = (value: string): void => {
    document.cookie = `locale=${value};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="flex justify-start">
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger
          size="sm"
          className="h-9 border border-border bg-card-2 text-foreground hover:border-muted-foreground hover:bg-card-hover"
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

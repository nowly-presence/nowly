import { RiGlobalLine } from "@remixicon/react"
import { LocaleFlag } from "@/components/shared/locale-flag"
import { marketplaceLocale } from "@/features/onboarding/onboarding.utils"
import { t, type LocalePreference } from "@/shared/i18n"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"

type Props = {
  localePreference: LocalePreference
  onLocaleChange: (locale: LocalePreference) => void
}

export const LocalePicker = ({ localePreference, onLocaleChange }: Props): React.JSX.Element => (
  <Select
    value={localePreference}
    onValueChange={(value) => onLocaleChange(value as LocalePreference)}
    items={{
      browser: t("locale-auto"),
      fr: t("locale-fr"),
      en: t("locale-en"),
      es: t("locale-es"),
      de: t("locale-de"),
      "pt-BR": t("locale-pt-br"),
      pl: t("locale-pl"),
      ja: t("locale-ja"),
      ko: t("locale-ko"),
      tr: t("locale-tr"),
      ms: t("locale-ms"),
      el: t("locale-el"),
    }}
  >
    <SelectTrigger
      size="sm"
      aria-label={t("language")}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="browser">
        <RiGlobalLine className="size-4 text-muted-foreground" />
        {t("locale-auto")}
      </SelectItem>
      <SelectItem value="fr">
        <LocaleFlag locale={marketplaceLocale("fr")} />
        {t("locale-fr")}
      </SelectItem>
      <SelectItem value="en">
        <LocaleFlag locale={marketplaceLocale("en")} />
        {t("locale-en")}
      </SelectItem>
      <SelectItem value="es">
        <LocaleFlag locale={marketplaceLocale("es")} />
        {t("locale-es")}
      </SelectItem>
      <SelectItem value="de">
        <LocaleFlag locale={marketplaceLocale("de")} />
        {t("locale-de")}
      </SelectItem>
      <SelectItem value="pt-BR">
        <LocaleFlag locale={marketplaceLocale("pt-BR")} />
        {t("locale-pt-br")}
      </SelectItem>
      <SelectItem value="pl">
        <LocaleFlag locale={marketplaceLocale("pl")} />
        {t("locale-pl")}
      </SelectItem>
      <SelectItem value="ja">
        <LocaleFlag locale={marketplaceLocale("ja")} />
        {t("locale-ja")}
      </SelectItem>
      <SelectItem value="ko">
        <LocaleFlag locale={marketplaceLocale("ko")} />
        {t("locale-ko")}
      </SelectItem>
      <SelectItem value="tr">
        <LocaleFlag locale={marketplaceLocale("tr")} />
        {t("locale-tr")}
      </SelectItem>
      <SelectItem value="ms">
        <LocaleFlag locale={marketplaceLocale("ms")} />
        {t("locale-ms")}
      </SelectItem>
      <SelectItem value="el">
        <LocaleFlag locale={marketplaceLocale("el")} />
        {t("locale-el")}
      </SelectItem>
    </SelectContent>
  </Select>
)

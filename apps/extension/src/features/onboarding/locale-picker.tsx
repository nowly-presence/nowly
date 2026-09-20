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
    items={{ browser: t("locale-auto"), fr: t("locale-fr"), en: t("locale-en"), es: t("locale-es") }}
  >
    <SelectTrigger size="sm" aria-label={t("language")}>
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
    </SelectContent>
  </Select>
)

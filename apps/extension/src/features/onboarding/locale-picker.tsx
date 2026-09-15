import { LocaleFlag } from "@/components/shared/locale-flag";
import { CustomSelect } from "@/components/ui/custom-select";
import { t, type LocalePreference } from "@/shared/i18n";
import { IconWorld } from "@/lib/tabler-icons";
import { useMemo, type FC } from "react";
import { marketplaceLocale } from "@/features/onboarding/onboarding.utils";

type Props = {
  localePreference: LocalePreference;
  onLocaleChange: (locale: LocalePreference) => void;
};

export const LocalePicker: FC<Props> = ({ localePreference, onLocaleChange }) => {
  const localeOptions = useMemo(() => [
    { icon: <IconWorld className="size-4 text-muted-foreground" />, label: t("locale-auto"), value: "browser" as const },
    { icon: <LocaleFlag locale={marketplaceLocale("fr")} />, label: t("locale-fr"), value: "fr" as const },
    { icon: <LocaleFlag locale={marketplaceLocale("en")} />, label: t("locale-en"), value: "en" as const },
    { icon: <LocaleFlag locale={marketplaceLocale("es")} />, label: t("locale-es"), value: "es" as const },
  ], [localePreference]);

  return (
    <CustomSelect
      aria-label={t("language")}
      className="h-8 text-xs font-medium"
      onChange={onLocaleChange}
      options={localeOptions}
      value={localePreference}
    />
  );
};

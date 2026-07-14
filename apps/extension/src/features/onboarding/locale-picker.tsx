import { LocaleFlag } from "@/components/shared/locale-flag";
import { Select } from "@/components/ui/select";
import { t, type LocalePreference } from "@/shared/i18n";
import { IconChevronDown } from "@tabler/icons-react";
import { useMemo, type FC } from "react";
import { marketplaceLocale } from "@/features/onboarding/onboarding.utils";

type Props = {
  localePreference: LocalePreference;
  onLocaleChange: (locale: LocalePreference) => void;
};

export const LocalePicker: FC<Props> = ({ localePreference, onLocaleChange }) => {
  const localeOptions = useMemo<Array<{ label: string; value: LocalePreference }>>(() => [
    { label: t("locale-auto"), value: "browser" },
    { label: t("locale-fr"), value: "fr" },
    { label: t("locale-en"), value: "en" },
    { label: t("locale-es"), value: "es" },
  ], [localePreference]);

  return (
    <div className="relative ml-auto">
      <Select
        unstyled
        value={localePreference}
        onChange={(event) => onLocaleChange(event.target.value as LocalePreference)}
        className="h-8 appearance-none rounded-lg border border-border bg-card-2 pl-8 pr-8 text-xs text-foreground outline-none transition-colors hover:bg-card-hover focus:border-border-light"
      >
        {localeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
        <LocaleFlag locale={marketplaceLocale(localePreference)} />
      </div>
      <IconChevronDown className="pointer-events-none absolute inset-y-0 right-3 my-auto h-3 w-3 text-muted-foreground" />
    </div>
  );
};
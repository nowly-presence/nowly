import { createContext, useContext, useState, type ReactNode } from "react";
import { useI18n } from "@/hooks/i18n-provider";
import { longLocaleName, type LongLocale } from "@/shared/locales";
import { Chip } from "@/ui/chip";
import { HScroll } from "@/ui/horizontal-scroller";
import { LocaleFlag } from "@/ui/locale-flag";

type EditLocales = Record<string, LongLocale>;

const EditLocaleContext = createContext<[EditLocales, (update: (current: EditLocales) => EditLocales) => void]>([
  {},
  () => undefined
]);

export const EditLocaleProvider = ({ children }: {
  children: ReactNode;
}) => {
  const state = useState<EditLocales>({});
  return (
    <EditLocaleContext.Provider value={state}>
      {children}
    </EditLocaleContext.Provider>
  );
};

export const useEditLocale = (scope: string, locales: LongLocale[], base: LongLocale) => {
  const [values, setValues] = useContext(EditLocaleContext);
  const value = values[scope];
  const setLocale = (locale: LongLocale) =>
    setValues((current) => ({
      ...current,
      [scope]: locale
    }));
  return [value && locales.includes(value) ? value : base, setLocale] as const;
};

type CreatorLocaleTabsProps = {
  locales: LongLocale[];
  value: LongLocale;
  base: LongLocale;
  onChange: (locale: LongLocale) => void;
  incomplete?: ReadonlySet<LongLocale>;
};

export const CreatorLocaleTabs = ({ locales, value, base, onChange, incomplete }: CreatorLocaleTabsProps) => {
  const { t } = useI18n();

  if (locales.length < 2) return null;

  return (
    <div className="flex flex-col gap-2">
      <HScroll>
        <div className="flex gap-2" role="tablist" aria-label={t("creator.language.locales")}>
          {locales.map((locale) => (
            <Chip
              key={locale}
              role="tab"
              aria-selected={locale === value}
              active={locale === value}
              onClick={() => onChange(locale)}
              icon={<LocaleFlag locale={locale} className="size-3.5" />}
            >
              {longLocaleName(locale)}
              {incomplete?.has(locale) && <span className="ml-1 size-1.5 rounded-full bg-danger" role="img" aria-label={t("creator.texts.incomplete")} />}
            </Chip>
          ))}
        </div>
      </HScroll>
      {value !== base && (
        <p className="text-label-md text-muted">
          {t("creator.texts.translating", {
            language: longLocaleName(value),
            base: longLocaleName(base)
          })}
        </p>
      )}
    </div>
  );
};
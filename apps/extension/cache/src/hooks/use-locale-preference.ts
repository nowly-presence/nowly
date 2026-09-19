import { useEffect, useState } from "react";
import {
  getLocalePreference,
  loadLocalePreference,
  setLocalePreference as saveLocalePreference,
  type LocalePreference,
} from "@/shared/i18n";

type LocalePreferenceState = {
  localePreference: LocalePreference;
  setLocalePreference: (preference: LocalePreference) => void;
};

export const useLocalePreference = (): LocalePreferenceState => {
  const [localePreference, setCurrentLocalePreference] = useState<LocalePreference>(getLocalePreference());

  useEffect(() => {
    void loadLocalePreference().then(setCurrentLocalePreference);
  }, []);

  const setLocalePreference = (preference: LocalePreference): void => {
    setCurrentLocalePreference(preference);
    void saveLocalePreference(preference);
  };

  return { localePreference, setLocalePreference };
};

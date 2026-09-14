import { LocaleFlag } from "@/components/shared/locale-flag";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { localeLabel, resolveLocaleString } from "@/features/presences/presence-locale";
import { sendMessage } from "@/lib/messages";
import { t } from "@/shared/i18n";
import type { ExtensionSettings, PresenceLocale } from "@/shared/types";
import { IconChevronDown } from "@/lib/tabler-icons";
import type { FC, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

type SettingDefinition = Record<string, unknown> & { default?: unknown; type?: string };

type Props = {
  definitions: Record<string, unknown>;
  locales?: Record<string, Record<string, string>>;
  slug: string;
};

const inferType = (value: unknown): string => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") return "input";
  if (typeof value === "number") return "slider";
  return "unknown";
};

export const PresenceSettingsFields: FC<Props> = ({ definitions, locales, slug }): ReactNode => {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loaded, setLoaded] = useState(false);
  const [extensionSettings, setExtensionSettings] = useState<ExtensionSettings | null>(null);

  useEffect(() => {
    if (!definitions) return;
    Promise.all([
      sendMessage<Record<string, Record<string, unknown>>>("GET_PRESENCE_SETTINGS"),
      sendMessage<ExtensionSettings>("GET_SETTINGS"),
    ]).then(([all, currentExtensionSettings]) => {
      const saved = all[slug] ?? {};
      const defaults: Record<string, unknown> = {};
      for (const [key, def] of Object.entries(definitions)) {
        if (typeof def === "object" && def !== null && "default" in def) {
          defaults[key] = (def as SettingDefinition).default;
        } else {
          defaults[key] = def;
        }
      }
      const merged = { ...defaults, ...saved };
      setValues(merged);
      setLoaded(true);
      setExtensionSettings(currentExtensionSettings);
    });
  }, [slug, definitions]);

  useEffect(() => {
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string): void => {
      if (area === "local" && changes.settings?.newValue) {
        setExtensionSettings(changes.settings.newValue as ExtensionSettings);
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []);

  const handleChange = useCallback((key: string, value: unknown): void => {
    setValues((prev) => ({ ...prev, [key]: value }));
    void sendMessage("SET_PRESENCE_SETTINGS", { slug, partial: { [key]: value } });
  }, [slug]);

  if (!loaded || !definitions) return null;

  const settingKeys = Object.entries(definitions);
  const showLanguage = Boolean(locales && (extensionSettings?.presenceLanguage ?? "per-presence") === "per-presence");
  const presenceLocale = extensionSettings?.presenceLanguages?.[slug] ?? "en-US";

  if (!showLanguage && settingKeys.length === 0) return null;

  const handleLanguageChange = (locale: PresenceLocale): void => {
    if (!extensionSettings) return;
    void sendMessage("SET_SETTINGS", {
      presenceLanguages: { ...(extensionSettings.presenceLanguages ?? {}), [slug]: locale },
    });
  };

  return (
    <>
      {showLanguage ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Label unstyled className="text-sm text-foreground">{t("presence-language-this")}</Label>
          <div className="relative">
            <Select
              unstyled
              value={presenceLocale}
              onChange={(event) => handleLanguageChange(event.target.value as PresenceLocale)}
              className="h-10 w-36 appearance-none rounded-xl border border-border bg-card-2 py-1 pl-8 pr-8 text-sm text-foreground outline-none transition-colors focus:border-border-light"
            >
              {Object.keys(locales ?? {}).map((locale) => (
                <option key={locale} value={locale}>{localeLabel(locale)}</option>
              ))}
            </Select>
            <div className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground">
              <LocaleFlag locale={presenceLocale} />
            </div>
            <IconChevronDown className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-muted-foreground" />
          </div>
        </div>
      ) : null}
      {settingKeys.map(([key, def]) => {
        const defObj = typeof def === "object" && def !== null ? (def as SettingDefinition) : null;
        const type = defObj?.type ?? inferType(def);
        const label = defObj?.label
          ? (resolveLocaleString(defObj.label) ?? key)
          : key;
        const placeholder = resolveLocaleString(defObj?.placeholder);
        const value = values[key];
        const switchId = `switch-${slug}-${key}`;

        return (
          <div key={key} className="flex items-center justify-between gap-3 px-4 py-3">
            <Label unstyled htmlFor={switchId} className="cursor-pointer text-sm text-foreground">{label}</Label>

            {type === "boolean" ? (
              <Switch
                id={switchId}
                checked={Boolean(value)}
                onChange={(v) => handleChange(key, v)}
              />
            ) : null}

            {type === "input" ? (
              <Input
                unstyled
                type="text"
                value={String(value ?? "")}
                placeholder={placeholder ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                className="h-10 w-44 rounded-xl border border-border bg-card-2 px-3 text-sm text-foreground outline-none transition-colors focus:border-border-light"
              />
            ) : null}

            {type === "select" ? (
              <Select
                unstyled
                value={String(value ?? "")}
                onChange={(e) => handleChange(key, e.target.value)}
                className="h-10 w-44 rounded-xl border border-border bg-card-2 px-3 text-sm text-foreground outline-none transition-colors focus:border-border-light"
              >
                {(defObj?.options as Array<Record<string, unknown>> | undefined)?.map((opt) => {
                  const optValue = String(opt?.value ?? "");
                  const optionLabel = resolveLocaleString(opt?.label) ?? (opt?.label != null ? String(opt.label) : optValue);
                  return (
                    <option key={optValue} value={optValue}>
                      {optionLabel}
                    </option>
                  );
                })}
              </Select>
            ) : null}

            {type === "slider" ? (
              <div className="flex items-center gap-2">
                <Input
                  unstyled
                  type="range"
                  min={defObj?.min !== undefined ? Number(defObj.min) : 0}
                  max={defObj?.max !== undefined ? Number(defObj.max) : 100}
                  step={defObj?.step !== undefined ? Number(defObj.step) : 1}
                  value={Number(value ?? 0)}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                  className="h-1 w-24 cursor-pointer accent-accent"
                />
                <span className="w-8 text-right text-sm text-muted-foreground">{String(value ?? 0)}</span>
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

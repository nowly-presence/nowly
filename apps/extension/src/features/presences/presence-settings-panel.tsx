import { LocaleFlag } from "@/components/shared/locale-flag";
import { Sheet } from "@/components/shared/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { sendMessage } from "@/lib/messages";
import { getLocale, t } from "@/shared/i18n";
import type { ExtensionSettings, PresenceLocale } from "@/shared/types";
import { IconChevronDown, IconSettings, IconTrash } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type SettingDefinition = Record<string, unknown> & { default?: unknown; type?: string };

const localeKeyMap: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
};

const localeLabelKeys: Record<string, string> = {
  "en-US": "locale-en",
  "fr-FR": "locale-fr",
  "es-ES": "locale-es",
};

const localeLabel = (locale: string): string => {
  const key = localeLabelKeys[locale];
  return key ? t(key) : locale;
};

const resolveLocaleString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const map = value as Record<string, string>;
    const locale = getLocale();
    return map[localeKeyMap[locale]] ?? map["en-US"] ?? undefined;
  }
  return undefined;
};

type Props = {
  definitions: Record<string, unknown>;
  locales?: Record<string, Record<string, string>>;
  onRemove?: () => void;
  slug: string;
};

const inferType = (value: unknown): string => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") return "input";
  if (typeof value === "number") return "slider";
  return "unknown";
};

export const PresenceSettingsPanel: FC<Props> = ({ definitions, locales, onRemove, slug }): ReactElement | null => {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [extensionSettings, setExtensionSettings] = useState<ExtensionSettings | null>(null);
  const initialRef = useRef<Record<string, unknown> | null>(null);

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
        initialRef.current = merged;
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

  const handleLanguageChange = (locale: PresenceLocale): void => {
    if (!extensionSettings) return;
    void sendMessage("SET_SETTINGS", {
      presenceLanguages: { ...(extensionSettings.presenceLanguages ?? {}), [slug]: locale },
    });
  };

  return (
    <>
      <Button
        variant="unstyled"
        size="none"
        aria-label={t("settings")}
        title={t("settings")}
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      >
        <IconSettings className="h-4 w-4" />
      </Button>

      {open && (
          <Sheet title={t("settings")} open={open} onClose={() => setOpen(false)} position="bottom">
          <div className="flex flex-col gap-4">
            {showLanguage ? (
              <div className="flex items-center justify-between gap-3">
                <Label unstyled className="text-sm text-foreground">{t("presence-language")}</Label>
                <div className="relative">
                  <Select
                    unstyled
                    value={presenceLocale}
                    onChange={(event) => handleLanguageChange(event.target.value as PresenceLocale)}
                    className="h-8 w-44 rounded-lg border border-border bg-card-2 py-1 pl-8 pr-8 text-sm text-foreground outline-none transition-colors focus:border-border-light"
                  >
                    {Object.keys(locales ?? {}).map((locale) => (
                      <option key={locale} value={locale}>{localeLabel(locale)}</option>
                    ))}
                  </Select>
                  <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-muted-foreground">
                    <LocaleFlag locale={presenceLocale} />
                  </div>
                  <IconChevronDown className="pointer-events-none absolute inset-y-0 right-3 my-auto h-3 w-3 text-muted-foreground" />
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
                <div key={key} className="flex items-center justify-between gap-3">
                  <Label unstyled htmlFor={switchId} className="text-sm text-foreground cursor-pointer">{label}</Label>

                  {type === "boolean" && (
                    <Switch
                      id={switchId}
                      checked={Boolean(value)}
                      onChange={(v) => handleChange(key, v)}
                    />
                  )}

                  {type === "input" && (
                    <Input
                      unstyled
                      type="text"
                      value={String(value ?? "")}
                      placeholder={placeholder ?? ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="h-8 w-44 rounded-lg border border-border bg-card-2 px-3 text-sm text-foreground outline-none transition-colors focus:border-border-light"
                    />
                  )}

                  {type === "select" && (
                    <Select
                      unstyled
                      value={String(value ?? "")}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="h-8 w-44 rounded-lg border border-border bg-card-2 px-3 text-sm text-foreground outline-none transition-colors focus:border-border-light"
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
                  )}

                  {type === "slider" && (
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
                      <span className="w-6 text-right text-xs text-muted-foreground">{String(value ?? 0)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {onRemove && (
            <div className="mt-6">
              <Button
                variant="unstyled"
                size="none"
                onClick={onRemove}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/15"
              >
                <IconTrash className="h-4 w-4" />
                {t("uninstall")}
              </Button>
            </div>
          )}
        </Sheet>
      )}
    </>
  );
};

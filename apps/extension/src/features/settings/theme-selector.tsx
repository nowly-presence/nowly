import { t } from "@/shared/i18n";
import type { AccentTheme, ExtensionSettings } from "@/shared/types";
import type { FC, ReactElement } from "react";

type Props = {
  settings: ExtensionSettings;
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void;
};

const THEMES: Array<{ key: AccentTheme; color: string }> = [
  { key: "default", color: "#22d3ee" },
  { key: "donator", color: "#FEE961" },
  { key: "fleuri", color: "#DA47D0" },
  { key: "violet", color: "#A78BFA" },
  { key: "vert", color: "#4ADE80" },
  { key: "orange", color: "#FB923C" },
];

export const ThemeSelector: FC<Props> = ({ settings, onSettingsChange }): ReactElement => {
  const current = settings.theme ?? "default";

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold text-muted-foreground">
        {t("theme-section-title")}
      </h2>
      <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("theme-section-description")}</p>
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map(({ key, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSettingsChange({ theme: key })}
            className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors ${
              current === key
                ? "border-accent bg-accent/10"
                : "border-border bg-card-2 hover:bg-card-hover"
            }`}
          >
            <span className="h-6 w-6 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs font-medium text-foreground">
              {t(`theme-${key}` as const)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

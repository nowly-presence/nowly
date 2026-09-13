import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import type { ExtensionSettings, PresenceDisplayMode } from "@/shared/types";
import { IconLayoutGrid, IconList } from "@/lib/tabler-icons";
import type { FC, ReactElement } from "react";

type Props = {
  settings: ExtensionSettings;
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void;
};

export const DisplaySettings: FC<Props> = ({ settings, onSettingsChange }): ReactElement => (
  <section>
    <h2 className="mb-2 text-xs font-semibold text-muted-foreground">{t("display")}</h2>
    <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("display-description")}</p>

    <div className="flex gap-2">
      <Button
        variant="unstyled"
        size="none"
        onClick={() => onSettingsChange({ presenceDisplayMode: "category" as PresenceDisplayMode })}
        className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
          settings.presenceDisplayMode === "category"
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-card-2 text-muted-foreground hover:bg-card-hover hover:text-foreground"
        }`}
      >
        <IconLayoutGrid className="h-4 w-4" />
        {t("display-category")}
      </Button>
      <Button
        variant="unstyled"
        size="none"
        onClick={() => onSettingsChange({ presenceDisplayMode: "alphabetical" as PresenceDisplayMode })}
        className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
          settings.presenceDisplayMode === "alphabetical"
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-card-2 text-muted-foreground hover:bg-card-hover hover:text-foreground"
        }`}
      >
        <IconList className="h-4 w-4" />
        {t("display-alphabetical")}
      </Button>
    </div>
  </section>
);

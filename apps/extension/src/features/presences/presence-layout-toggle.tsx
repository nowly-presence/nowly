import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import type { PresenceDisplayMode } from "@/shared/types";
import { IconLayoutGrid, IconList } from "@/lib/tabler-icons";
import type { FC, ReactElement } from "react";

type Props = {
  value: PresenceDisplayMode;
  onChange: (mode: PresenceDisplayMode) => void;
};

const options: Array<{ id: PresenceDisplayMode; icon: typeof IconList; labelKey: "display-list" | "display-grid" }> = [
  { id: "category", icon: IconList, labelKey: "display-list" },
  { id: "grid", icon: IconLayoutGrid, labelKey: "display-grid" },
];

export const PresenceLayoutToggle: FC<Props> = ({ value, onChange }): ReactElement => (
  <div
    role="group"
    aria-label={t("display")}
    className="inline-flex h-8 shrink-0 items-center rounded-lg bg-card-2 p-0.5"
  >
    {options.map((option) => {
      const Icon = option.icon;
      const selected = value === option.id;

      return (
        <Button
          key={option.id}
          variant="unstyled"
          size="none"
          aria-label={t(option.labelKey)}
          aria-pressed={selected}
          onClick={() => onChange(option.id)}
          className={`flex size-7 items-center justify-center rounded-md transition-colors ${
            selected
              ? "bg-card text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="size-3.5" />
        </Button>
      );
    })}
  </div>
);

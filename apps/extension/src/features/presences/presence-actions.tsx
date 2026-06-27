import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import { IconPower, IconTrash, IconX } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";

type Props = {
  enabled: boolean;
  onClose: () => void;
  onRemove: () => void;
  onToggle: () => void;
  visible: boolean;
};

export const PresenceActions: FC<Props> = ({ enabled, onClose, onRemove, onToggle, visible }): ReactElement => (
  <div
    className={
      visible
        ? "absolute inset-0 flex items-center justify-end gap-1.5 bg-linear-to-l from-card via-card/90 to-card/45 px-3 opacity-100 backdrop-blur-md transition-all"
        : "pointer-events-none absolute inset-0 flex translate-x-full items-center justify-end gap-1.5 bg-linear-to-l from-card via-card/90 to-card/45 px-3 opacity-0 backdrop-blur-md transition-all"
    }
  >
    <Button
      variant="unstyled"
      size="none"
      aria-label={enabled ? t("disable") : t("enable")}
      title={enabled ? t("disable") : t("enable")}
      onClick={onToggle}
      className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card-2 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <IconPower className="h-4 w-4" />
      {enabled ? t("disable") : t("enable")}
    </Button>
    <Button
      variant="unstyled"
      size="none"
      aria-label={t("remove")}
      title={t("remove")}
      onClick={onRemove}
      className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card-2 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
    >
      <IconTrash className="h-4 w-4" />
      {t("uninstall")}
    </Button>
    <Button
      variant="unstyled"
      size="none"
      aria-label={t("close")}
      title={t("close")}
      onClick={onClose}
      className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card-2 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <IconX className="h-4 w-4" />
      {t("close")}
    </Button>
  </div>
);
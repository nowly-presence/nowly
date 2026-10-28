import { PresenceIcon } from "@/components/shared/presence-icon";
import { useI18n } from "@/hooks/i18n-provider";
import type { PresenceStatus } from "@/lib/presence-status";
import type { StoredPresence } from "@/shared/types";
import { cn } from "@/ui/cn";
import { Switch } from "@/ui/switch";
import type { StatusLine } from "@/features/activity/presence-status-text";
import { PresenceStatusLabel } from "@/features/activity/presence-status-label";
import { Badge } from "@/ui/badge";

type PresenceGridCardProps = {
  slug: string;
  stored: StoredPresence;
  status: PresenceStatus;
  line: StatusLine;
  hasUpdate: boolean;
  onOpen: () => void;
  onToggle: (enabled: boolean) => void;
};

export const PresenceGridCard = ({ slug, stored, status, line, hasUpdate, onOpen, onToggle }: PresenceGridCardProps) => {
  const { t } = useI18n();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => event.key === "Enter" && onOpen()}
      className={cn(
        "flex cursor-pointer flex-col gap-3 rounded-sm border border-line bg-surface p-3 transition-colors hover:border-line-strong",
        !stored.enabled && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <PresenceIcon slug={slug} name={stored.metadata.name} color={stored.metadata.color} size={36} />
        <Switch size="sm" checked={stored.enabled} label={stored.metadata.name} onChange={onToggle} />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-label-lg font-medium">{stored.metadata.name}</span>
          {hasUpdate && <Badge tone="primary">{t("badge.update")}</Badge>}
        </span>
        <PresenceStatusLabel status={status} line={line} className="truncate text-label-md" />
      </div>
    </div>
  );
};
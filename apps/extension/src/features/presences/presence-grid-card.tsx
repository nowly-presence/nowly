import { assetUrl } from "@/shared/api";
import { t } from "@/shared/i18n";
import type { StoredPresence } from "@/shared/types";
import type { FC, ReactElement } from "react";

type Props = {
  onOpen: (slug: string) => void;
  presence: StoredPresence;
  slug: string;
  updateAvailable?: string;
};

export const PresenceGridCard: FC<Props> = ({
  onOpen,
  presence,
  slug,
  updateAvailable,
}): ReactElement | null => {
  if (!presence?.metadata) return null;

  const color = presence.metadata.color;
  const status = presence.enabled ? t("enabled") : t("disabled");

  return (
    <button
      type="button"
      onClick={() => onOpen(slug)}
      aria-label={`${presence.metadata.name}. ${status}`}
      className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-3 text-left outline-none transition-colors hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-accent/50"
      style={{ backgroundImage: `radial-gradient(90px 70px at 34px 34px, ${color}20, transparent 70%)` }}
    >
      {updateAvailable ? (
        <span className="mb-2 flex w-full items-center rounded-lg border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-medium text-accent">
          <span className="min-w-0 flex-1 truncate">{t("presence-update-available")}</span>
        </span>
      ) : null}

      <span className="flex min-w-0 items-start gap-2.5">
        <span
          className={`flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
            presence.enabled ? "" : "opacity-60 saturate-0"
          }`}
          style={{ backgroundColor: `${color}20` }}
        >
          <img src={assetUrl(slug, "icon")} alt="" className="size-7 object-contain" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm font-semibold ${
              presence.enabled ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {presence.metadata.name}
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: presence.enabled ? color : "var(--color-dim-foreground)" }}
            />
            <span className="truncate">{status}</span>
          </span>
        </span>
      </span>
    </button>
  );
};

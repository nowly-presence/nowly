import { RiDiscordFill } from "@remixicon/react";
import { CustomActivityArtwork } from "@/components/shared/custom-activity-artwork";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";

export const CustomActivityPublicationPreview = ({ id, creatorRequired }: {
  id: string;
  creatorRequired: boolean;
}) => {
  const { state } = useExtensionState();
  const { t } = useI18n();
  const activity = state.customActivities.items.find((item) => item.id === id);
  const user = !creatorRequired && state.account.signedIn ? state.account.user : null;

  if (!activity) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-hover" data-testid="custom-publication-preview">
      <div className="flex items-center gap-3 p-4">
        <CustomActivityArtwork source={activity} size={48} rounded="rounded-md" />
        <div className="min-w-0">
          <p className="truncate text-body-md font-medium text-ink">{activity.name}</p>
          {activity.details && <p className="truncate text-body-sm text-muted">{activity.details}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-line bg-surface px-4 py-3">
        {user ? (
          <>
            {user.image ? (
              <img src={user.image} alt="" className="size-8 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-hover">
                <RiDiscordFill className="size-5 text-muted" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-label-md font-medium text-ink">{user.name}</p>
              <p className="text-label-sm text-muted">{t("custom.public.authorHint")}</p>
            </div>
          </>
        ) : (
          <p className="text-label-sm text-muted">{t("custom.public.authorPlaceholder")}</p>
        )}
      </div>
    </div>
  );
};
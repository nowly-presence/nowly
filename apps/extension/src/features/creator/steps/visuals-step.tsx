import { useI18n } from "@/hooks/i18n-provider";
import { CREATOR_DEFAULT_COLOR } from "@/shared/creator/creator-draft";
import type { CreatorDraft } from "@/shared/creator/creator-types";
import { Checkbox } from "@/ui/checkbox";
import { dominantColor } from "@/features/creator/creator-image";
import { CreatorImageField } from "@/features/creator/creator-image-field";
import type { DraftUpdate } from "@/features/creator/use-draft-editor";

export const VisualsStep = ({ draft, update }: {
  draft: CreatorDraft;
  update: DraftUpdate;
}) => {
  const { t } = useI18n();
  const { assets } = draft;

  return (
    <div className="flex flex-col gap-3">
      <CreatorImageField
        kind="thumbnail"
        title={t("creator.visuals.thumbnail")}
        requirement={t("creator.visuals.thumbnailHint")}
        value={assets.thumbnail}
        onChange={(asset) =>
          update((current) => ({
            ...current,
            assets: {
              ...current.assets,
              thumbnail: asset?.dataUrl
            }
          }))
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <CreatorImageField
          kind="logo"
          title={t("creator.visuals.logo")}
          requirement={t("creator.visuals.logoHint")}
          value={assets.logo}
          onChange={(asset) => {
            update((current) => ({
              ...current,
              assets: {
                ...current.assets,
                logo: asset?.dataUrl
              }
            }));

            if (asset && draft.color === CREATOR_DEFAULT_COLOR) {
              void dominantColor(asset.dataUrl).then((color) => {
                if (color) update((current) => (current.color === CREATOR_DEFAULT_COLOR ? { ...current, color } : current));
              });
            }
          }}
        />
        <CreatorImageField
          kind="icon"
          title={t("creator.visuals.icon")}
          requirement={t("creator.visuals.iconHint")}
          value={assets.icon}
          warning={assets.iconTransparent === false ? t("creator.visuals.iconOpaque") : undefined}
          onChange={(asset) =>
            update((current) => ({
              ...current,
              assets: {
                ...current.assets,
                icon: asset?.dataUrl,
                iconTransparent: asset?.transparent
              }
            }))
          }
        />
      </div>
      {assets.thumbnail && (
        <div className="px-1 pt-2">
          <Checkbox
            checked={assets.thumbnailRightsConfirmed}
            onChange={(checked) =>
              update((current) => ({
                ...current,
                assets: {
                  ...current.assets,
                  thumbnailRightsConfirmed: checked
                }
              }))
            }
          >
            {t("creator.visuals.rights")}
          </Checkbox>
        </div>
      )}
    </div>
  );
};
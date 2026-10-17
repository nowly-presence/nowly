import { useI18n } from "@/hooks/i18n-provider";
import type { CustomImage } from "@/shared/types";
import { Group } from "@/ui/card";
import { Section } from "@/ui/section";
import { CustomImageField } from "@/features/custom-activity/custom-image-field";
import type { CustomActivitySectionProps } from "@/features/custom-activity/custom-activity-section-props";

type CustomActivityImagesSectionProps = CustomActivitySectionProps & {
  upload: (dataUrl: string) => Promise<CustomImage | null>;
  uploading: boolean;
};

export const CustomActivityImagesSection = ({ draft, patch, errors, upload, uploading }: CustomActivityImagesSectionProps) => {
  const { t } = useI18n();
  return (
    <Section title={t("custom.editor.imagesSection")}>
      <Group>
        <CustomImageField
          title={t("custom.field.largeImage")}
          description={t("custom.field.largeImageHint")}
          image={draft.largeImage}
          onImageChange={(largeImage) => patch({ largeImage })}
          hoverText={draft.largeText}
          onHoverTextChange={(largeText) => patch({ largeText })}
          hoverError={errors.largeText}
          listeningHint={draft.type === 2}
          imageError={errors.largeImage}
          upload={upload}
          uploading={uploading}
          noneShowsNowly
        />
        <CustomImageField
          title={t("custom.field.smallImage")}
          description={t("custom.field.smallImageHint")}
          image={draft.smallImage}
          onImageChange={(smallImage) => patch({ smallImage })}
          hoverText={draft.smallText}
          onHoverTextChange={(smallText) => patch({ smallText })}
          hoverError={errors.smallText}
          imageError={errors.smallImage}
          upload={upload}
          uploading={uploading}
          round
        />
      </Group>
    </Section>
  );
};
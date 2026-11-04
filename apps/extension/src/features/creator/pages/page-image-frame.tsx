import { useI18n } from "@/hooks/i18n-provider";
import { isImageVariable } from "@nowly/presence-creator/creator-activity";
import type { CreatorImage, CreatorPage } from "@nowly/presence-creator/creator-types";
import { Frame } from "@/ui/frame";
import { UrlSourceField, type UrlSource } from "@/features/creator/pages/url-source-field";

const toUrlSource = (image: CreatorImage): UrlSource => (image.kind === "logo" ? { kind: "default" } : image);

const toImage = (source: UrlSource): CreatorImage => (source.kind === "default" ? { kind: "logo" } : source);

export const PageImageFrame = ({ page, onChange }: {
  page: CreatorPage;
  onChange: (page: CreatorPage) => void;
}) => {
  const { t } = useI18n();

  return (
    <Frame title={t("creator.page.image")} description={t("creator.page.imageHint")}>
      <UrlSourceField
        read="image"
        label={t("creator.page.image")}
        defaultLabel={t("creator.page.imageLogo")}
        value={toUrlSource(page.largeImage)}
        page={page}
        candidates={page.variables.filter(isImageVariable)}
        onChange={(next, source) =>
          onChange({
            ...next,
            largeImage: toImage(source)
          })
        }
      />
    </Frame>
  );
};
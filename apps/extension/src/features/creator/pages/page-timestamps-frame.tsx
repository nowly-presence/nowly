import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import type { CreatorPage, CreatorTimestamps } from "@nowly/presence-creator/creator-types";
import { Frame } from "@/ui/frame";
import { OptionCards } from "@/ui/option-cards";

const TIMESTAMPS: CreatorTimestamps[] = ["elapsed", "media"];
const TIMESTAMP_KEYS: Record<
  CreatorTimestamps,
  {
    label: MessageKey;
    hint: MessageKey;
  }
> = {
  elapsed: {
    label: "creator.page.timestampsElapsed",
    hint: "creator.page.timestampsElapsedHint"
  },
  media: {
    label: "creator.page.timestampsMedia",
    hint: "creator.page.timestampsMediaHint"
  }
};

export const PageTimestampsFrame = ({ page, onChange }: {
  page: CreatorPage;
  onChange: (page: CreatorPage) => void;
}) => {
  const { t } = useI18n();

  return (
    <Frame title={t("creator.page.timestamps")} description={t("creator.page.timestampsHint")}>
      <OptionCards<CreatorTimestamps>
        label={t("creator.page.timestamps")}
        value={page.timestamps}
        onValueChange={(timestamps) => onChange({ ...page, timestamps })}
        options={TIMESTAMPS.map((value) => ({
          value,
          label: t(TIMESTAMP_KEYS[value].label),
          description: t(TIMESTAMP_KEYS[value].hint)
        }))}
      />
    </Frame>
  );
};
import { RiEyeLine, RiGamepadLine, RiHeadphoneLine, RiTrophyLine } from "@remixicon/react";
import type { ReactNode } from "react";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import type { CreatorActivityType, CreatorDraft, CreatorPage } from "@nowly/presence-creator/creator-types";
import { Field } from "@/ui/field";
import { Frame } from "@/ui/frame";
import { Input } from "@/ui/input";
import { OptionCards } from "@/ui/option-cards";
import { PageAddressField } from "@/features/creator/pages/page-address-field";

const ACTIVITY_TYPES: CreatorActivityType[] = ["watching", "listening", "playing", "competing"];
const ACTIVITY_META: Record<
  CreatorActivityType,
  {
    label: MessageKey;
    hint: MessageKey;
    icon: ReactNode;
  }
> = {
  watching: {
    label: "activity.type.watching",
    hint: "creator.page.activityWatching",
    icon: <RiEyeLine />
  },
  listening: {
    label: "activity.type.listening",
    hint: "creator.page.activityListening",
    icon: <RiHeadphoneLine />
  },
  playing: {
    label: "activity.type.playing",
    hint: "creator.page.activityPlaying",
    icon: <RiGamepadLine />
  },
  competing: {
    label: "activity.type.competing",
    hint: "creator.page.activityCompeting",
    icon: <RiTrophyLine />
  }
};

export const PageIdentityFrame = ({ draft, page, onChange }: {
  draft: CreatorDraft;
  page: CreatorPage;
  onChange: (page: CreatorPage) => void;
}) => {
  const { t } = useI18n();
  const set = (partial: Partial<CreatorPage>) => onChange({ ...page, ...partial });

  return (
    <Frame title={t("creator.page.frameTitle")} description={t("creator.page.frameDescription")}>
      <Field label={t("creator.page.name")}>
        <Input value={page.name} onChange={(event) => set({ name: event.target.value })} placeholder={t("creator.page.namePlaceholder")} maxLength={40} />
      </Field>

      <PageAddressField domain={draft.domains[0] ?? "example.com"} page={page} onChange={onChange} />

      <Field label={t("creator.page.activityType")}>
        <OptionCards<CreatorActivityType>
          label={t("creator.page.activityType")}
          value={page.activityType}
          onValueChange={(value) => set({ activityType: value })}
          options={ACTIVITY_TYPES.map((value) => ({
            value,
            label: t(ACTIVITY_META[value].label),
            description: t(ACTIVITY_META[value].hint),
            icon: ACTIVITY_META[value].icon
          }))}
        />
      </Field>
    </Frame>
  );
};
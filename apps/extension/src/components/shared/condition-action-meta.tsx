import type { ReactNode } from "react";
import { RiChat3Line, RiChatOffLine, RiEyeOffLine, RiGamepadLine, RiImageCircleLine, RiImageLine, RiLinkM, RiPriceTag3Line, RiText, RiTimerLine, RiUserVoiceLine } from "@remixicon/react";
import { readableName } from "@/lib/readable-name";
import type { useI18n } from "@/hooks/i18n-provider";
import { textIn } from "@nowly/presence-creator/creator-draft";
import type { CreatorConditionAction, CreatorConditionActionKind, CreatorPage, LocalizedText } from "@nowly/presence-creator/creator-types";
import type { LongLocale } from "@/shared/locales";

export type ActionGroup = "texts" | "images" | "activity" | "buttons" | "presence";

type Translate = ReturnType<typeof useI18n>["t"];

const ICON = "size-[18px] text-muted";

export const ACTION_GROUPS: readonly ActionGroup[] = ["texts", "images", "activity", "buttons", "presence"];

export const ACTION_META: Record<
  CreatorConditionActionKind,
  {
    icon: ReactNode;
    group: ActionGroup;
  }
> = {
  details: {
    icon: <RiText className={ICON} />,
    group: "texts"
  },
  state: {
    icon: <RiChat3Line className={ICON} />,
    group: "texts"
  },
  activityName: {
    icon: <RiUserVoiceLine className={ICON} />,
    group: "texts"
  },
  largeImage: {
    icon: <RiImageLine className={ICON} />,
    group: "images"
  },
  smallImage: {
    icon: <RiImageCircleLine className={ICON} />,
    group: "images"
  },
  imageText: {
    icon: <RiPriceTag3Line className={ICON} />,
    group: "images"
  },
  activityType: {
    icon: <RiGamepadLine className={ICON} />,
    group: "activity"
  },
  timestamps: {
    icon: <RiTimerLine className={ICON} />,
    group: "activity"
  },
  hideButton: {
    icon: <RiEyeOffLine className={ICON} />,
    group: "buttons"
  },
  buttonLabel: {
    icon: <RiText className={ICON} />,
    group: "buttons"
  },
  buttonLink: {
    icon: <RiLinkM className={ICON} />,
    group: "buttons"
  },
  hidePresence: {
    icon: <RiChatOffLine className={ICON} />,
    group: "presence"
  }
};

export const buttonOptions = (page: CreatorPage, base: LongLocale, t: Translate) =>
  page.buttons.map((button, index) => ({
    value: button.id,
    label: textIn(button.label, base) || t("creator.buttons.untitled", { index: index + 1 })
  }));

const sourceLabel = (page: CreatorPage, source: {
  kind: string;
  variableId?: string;
  template?: string;
}, fallback: string): string => {
  if (source.kind === "custom") return source.template ?? "";
  if (source.kind === "variable") {
    const variable = page.variables.find((entry) => entry.id === source.variableId);
    return variable ? readableName(variable.name) : "";
  }

  return fallback;
};

export const actionSummary = (action: CreatorConditionAction, page: CreatorPage, base: LongLocale, t: Translate): string[] => {
  const button = "buttonId" in action ? buttonOptions(page, base, t).find((option) => option.value === action.buttonId)?.label : undefined;
  const text = (value: LocalizedText) => textIn(value, base);

  switch (action.kind) {
    case "details":
    case "state":
    case "activityName":
    case "imageText":
      return [text(action.text)];
    case "largeImage":
      return [sourceLabel(page, action.image, t("creator.page.imageLogo"))];
    case "smallImage":
      return [sourceLabel(page, action.image, t("creator.conditions.smallIcon"))];
    case "activityType":
      return [t(`activity.type.${action.activityType}`)];
    case "timestamps":
      return [t(action.timestamps === "media" ? "creator.page.timestampsMedia" : "creator.page.timestampsElapsed")];
    case "hideButton":
      return [button ?? ""];
    case "buttonLabel":
      return [
        button ?? "",
        text(action.text)
      ];
    case "buttonLink":
      return [
        button ?? "",
        sourceLabel(page, action.link, t("creator.source.currentPage"))
      ];
    case "hidePresence":
      return [];
  }
};
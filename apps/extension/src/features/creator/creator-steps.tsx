import type { ReactNode } from "react";
import { RiFileList3Line, RiGlobalLine, RiImageLine, RiPagesLine, RiPaletteLine, RiSendPlaneLine } from "@remixicon/react";
import type { MessageKey } from "@/hooks/i18n-provider";
import type { CreatorStep } from "@nowly/presence-creator/creator-types";

export const STEP_META: Record<
  CreatorStep,
  {
    icon: ReactNode;
    title: MessageKey;
    description: MessageKey;
  }
> = {
  visuals: {
    icon: <RiImageLine className="size-5" />,
    title: "creator.visuals.title",
    description: "creator.visuals.description"
  },
  identity: {
    icon: <RiPaletteLine className="size-5" />,
    title: "creator.identity.title",
    description: "creator.identity.description"
  },
  language: {
    icon: <RiGlobalLine className="size-5" />,
    title: "creator.language.title",
    description: "creator.language.description"
  },
  texts: {
    icon: <RiFileList3Line className="size-5" />,
    title: "creator.texts.title",
    description: "creator.texts.description"
  },
  pages: {
    icon: <RiPagesLine className="size-5" />,
    title: "creator.pages.title",
    description: "creator.pages.description"
  },
  review: {
    icon: <RiSendPlaneLine className="size-5" />,
    title: "creator.review.title",
    description: "creator.review.description"
  }
};
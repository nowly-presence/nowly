import { useState } from "react";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { sendMessage } from "@/lib/messages";
import type { CreatorPick } from "@nowly/presence-creator/creator-types";
import { useToast } from "@/ui/toast";

const PICK_ERROR_KEYS: Record<"NO_TAB" | "UNREACHABLE", MessageKey> = {
  NO_TAB: "creator.variables.noTab",
  UNREACHABLE: "creator.variables.unreachable"
};

export const usePicker = () => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [picking, setPicking] = useState(false);

  const pick = async (): Promise<CreatorPick | null> => {
    setPicking(true);
    const result = await sendMessage("CREATOR_PICK_START", {
      labels: {
        hint: t("creator.picker.hint"),
        keys: t("creator.picker.keys"),
        cancel: t("action.cancel"),
        move: t("creator.picker.move")
      }
    });
    setPicking(false);

    if (result.ok) return result.pick;

    if (result.error !== "CANCELLED") toast(t(PICK_ERROR_KEYS[result.error]), "error");
    return null;
  };

  return { picking, pick };
};
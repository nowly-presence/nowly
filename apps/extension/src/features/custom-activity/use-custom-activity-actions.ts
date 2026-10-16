import { useCallback, useState } from "react";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { rememberCustomImage } from "@/hooks/use-custom-image-data";
import { sendMessage } from "@/lib/messages";
import type {
  CustomActivity,
  CustomActivityDraft,
  CustomImage,
} from "@/shared/types";
import { useToast } from "@/ui/toast";

const UPLOAD_ERRORS: Record<string, MessageKey> = {
  TOO_LARGE: "custom.image.errorTooLarge",
  UNSUPPORTED_TYPE: "custom.image.errorType",
  INVALID_IMAGE: "custom.image.errorInvalid",
};

export const useCustomActivityActions = () => {
  const { refresh } = useExtensionState();
  const { toast } = useToast();
  const { t } = useI18n();
  const [pending, setPending] = useState<"save" | "delete" | "upload" | null>(
    null,
  );

  const save = useCallback(
    async (draft: CustomActivityDraft): Promise<CustomActivity | null> => {
      setPending("save");
      try {
        const result = await sendMessage("SAVE_CUSTOM_ACTIVITY", { draft });
        await refresh.customActivities();
        if (!result.ok) {
          toast(
            t(
              result.error === "LIMIT_REACHED"
                ? "custom.toast.limit"
                : "error.generic",
            ),
            "error",
          );
          return null;
        }
        toast(
          t(draft.id ? "custom.toast.saved" : "custom.toast.created", {
            name: result.activity.name,
          }),
        );
        return result.activity;
      } finally {
        setPending(null);
      }
    },
    [refresh, toast, t],
  );

  const remove = useCallback(
    async (activity: CustomActivity) => {
      setPending("delete");
      try {
        await sendMessage("DELETE_CUSTOM_ACTIVITY", { id: activity.id });
        await refresh.customActivities();
        toast(t("custom.toast.deleted", { name: activity.name }), "info");
      } finally {
        setPending(null);
      }
    },
    [refresh, toast, t],
  );

  const setActive = useCallback(
    async (id: string | null) => {
      await sendMessage("SET_CUSTOM_ACTIVITY_ACTIVE", { id });
      await Promise.all([refresh.customActivities(), refresh.activity()]);
    },
    [refresh],
  );

  const upload = useCallback(
    async (dataUrl: string): Promise<CustomImage | null> => {
      setPending("upload");
      try {
        const result = await sendMessage("UPLOAD_CUSTOM_IMAGE", { dataUrl });
        if (!result.ok) {
          toast(
            t(UPLOAD_ERRORS[result.error] ?? "custom.image.errorUpload"),
            "error",
          );
          return null;
        }
        if (result.image.kind === "upload")
          rememberCustomImage(result.image.hash, dataUrl);
        return result.image;
      } finally {
        setPending(null);
      }
    },
    [toast, t],
  );

  return { pending, save, remove, setActive, upload };
};
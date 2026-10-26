import { useCallback, useState } from "react";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { rememberCustomImage } from "@/hooks/use-custom-image-data";
import { sendMessage } from "@/lib/messages";
import type { CustomActivity, CustomActivityDraft, CustomImage } from "@/shared/types";
import { useToast } from "@/ui/toast";

const UPLOAD_ERRORS: Record<string, MessageKey> = {
  TOO_LARGE: "custom.image.errorTooLarge",
  UNSUPPORTED_TYPE: "custom.image.errorType",
  INVALID_IMAGE: "custom.image.errorInvalid"
};
const SAVE_ERRORS: Record<string, MessageKey> = {
  LOCAL_CHANGED: "custom.editor.changed",
  LIMIT_REACHED: "custom.toast.limit"
};

export const useCustomActivityActions = () => {
  const { refresh } = useExtensionState();
  const { toast } = useToast();
  const { t } = useI18n();
  const [pending, setPending] = useState<"save" | "delete" | "upload" | null>(null);

  const save = useCallback(async (draft: CustomActivityDraft, expectedUpdatedAt?: number): Promise<CustomActivity | null> => {
    setPending("save");

    try {
      const result = await sendMessage("SAVE_CUSTOM_ACTIVITY", { draft, expectedUpdatedAt });
      await refresh.customActivities();

      if (!result.ok) {
        toast(t(SAVE_ERRORS[result.error] ?? "error.generic"), "error");
        return null;
      }

      toast(t(draft.id ? "custom.toast.saved" : "custom.toast.created", { name: result.activity.name }));
      return result.activity;
    } finally {
      setPending(null);
    }
  }, [refresh, toast, t]);

  const remove = useCallback(async (activity: CustomActivity) => {
    setPending("delete");

    try {
      const result = await sendMessage("DELETE_CUSTOM_ACTIVITY", { id: activity.id });

      if (!result.ok) {
        toast(t(result.error === "PUBLICATION_ACTIVE" ? "custom.delete.published" : "custom.delete.verifyPublication"), "error");
        return false;
      }

      await refresh.customActivities();
      toast(t("custom.toast.deleted", { name: activity.name }), "info");
      return true;
    } finally {
      setPending(null);
    }
  }, [refresh, toast, t]);

  const setActive = useCallback(async (id: string | null) => {
    await sendMessage("SET_CUSTOM_ACTIVITY_ACTIVE", { id });
    await Promise.all([
      refresh.customActivities(),
      refresh.activity()
    ]);
  }, [refresh]);

  const upload = useCallback(async (dataUrl: string): Promise<CustomImage | null> => {
    setPending("upload");

    try {
      const result = await sendMessage("UPLOAD_CUSTOM_IMAGE", { dataUrl });

      if (!result.ok) {
        toast(t(UPLOAD_ERRORS[result.error] ?? "custom.image.errorUpload"), "error");
        return null;
      }

      if (result.image.kind === "upload") rememberCustomImage(result.image.hash, dataUrl);
      return result.image;
    } finally {
      setPending(null);
    }
  }, [toast, t]);

  return { pending, save, remove, setActive, upload };
};
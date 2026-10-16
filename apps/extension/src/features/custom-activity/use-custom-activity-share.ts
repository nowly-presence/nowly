import { useCallback, useRef, useState } from "react";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { rememberCustomImage } from "@/hooks/use-custom-image-data";
import { downloadJsonFile } from "@/lib/download-json-file";
import { sendMessage } from "@/lib/messages";
import { CUSTOM_ACTIVITIES_MAX } from "@/shared/custom-activity";
import { CUSTOM_ACTIVITY_FILE_MAX_BYTES, activityFileName, buildActivityFile, parseActivityFile, type ActivityFileError, type ParsedActivityFile } from "@/shared/custom-activity-share";
import type { CustomActivity, CustomImage } from "@/shared/types";
import { useToast } from "@/ui/toast";

const FILE_ERRORS: Record<ActivityFileError, MessageKey> = {
  TOO_LARGE: "custom.import.errorLarge",
  INVALID_JSON: "custom.import.errorFormat",
  WRONG_FORMAT: "custom.import.errorFormat",
  UNSUPPORTED_VERSION: "custom.import.errorVersion",
  INVALID_ACTIVITY: "custom.import.errorInvalid"
};

type FileOutcome = {
  ok: true;
  activity: CustomActivity;
  imageSkipped: boolean;
} | {
  ok: false;
  message: MessageKey;
};

const resolveImage = async (current: CustomImage, dataUrl: string | undefined): Promise<{
  image: CustomImage;
  skipped: boolean;
}> => {
  if (!dataUrl) return {
    image: current,
    skipped: false
  };

  try {
    const result = await sendMessage("UPLOAD_CUSTOM_IMAGE", { dataUrl });

    if (!result.ok) return {
      image: current,
      skipped: true
    };

    if (result.image.kind === "upload") rememberCustomImage(result.image.hash, dataUrl);
    return {
      image: result.image,
      skipped: false
    };
  } catch {
    return {
      image: current,
      skipped: true
    };
  }
};

const importParsed = async ({ draft, images }: ParsedActivityFile): Promise<FileOutcome> => {
  const [large, small] = await Promise.all([
    resolveImage(draft.largeImage, images.largeImage),
    resolveImage(draft.smallImage, images.smallImage)
  ]);

  const result = await sendMessage("SAVE_CUSTOM_ACTIVITY", {
    draft: {
      ...draft,
      largeImage: large.image,
      smallImage: small.image
    }
  });

  if (!result.ok) return {
    ok: false,
    message: result.error === "LIMIT_REACHED" ? "custom.toast.limit" : "error.generic"
  };

  return {
    ok: true,
    activity: result.activity,
    imageSkipped: large.skipped || small.skipped
  };
};

const importFile = async (file: File): Promise<FileOutcome> => {
  if (file.size > CUSTOM_ACTIVITY_FILE_MAX_BYTES) return {
    ok: false,
    message: FILE_ERRORS.TOO_LARGE
  };

  try {
    const parsed = parseActivityFile(await file.text());
    return parsed.ok ? await importParsed(parsed) : { ok: false, message: FILE_ERRORS[parsed.error] };
  } catch {
    return {
      ok: false,
      message: "error.generic"
    };
  }
};

export const useCustomActivityShare = (onImported: (activity: CustomActivity) => void) => {
  const { state, refresh } = useExtensionState();
  const { toast } = useToast();
  const { t } = useI18n();
  const [importing, setImporting] = useState(false);
  const importingRef = useRef(false);

  const exportActivity = useCallback(async (activity: CustomActivity) => {
    try {
      const hashes = [activity.largeImage, activity.smallImage].flatMap((image) => (image.kind === "upload" ? [image.hash] : []));

      let imageData: Record<string, string> = {};

      if (hashes.length > 0) {
        try {
          imageData = (await sendMessage("GET_CUSTOM_IMAGES", { hashes })) ?? {};
        } catch {
          imageData = {};
        }
      }

      downloadJsonFile(activityFileName(activity.name), buildActivityFile(activity, imageData));
      toast(t("custom.toast.exported", { name: activity.name }));
    } catch {
      toast(t("error.generic"), "error");
    }
  }, [toast, t]);

  const importFiles = useCallback(async (files: File[]) => {
    if (importingRef.current) return;

    const jsonFiles = files.filter((file) => file.type === "application/json" || file.name.toLowerCase().endsWith(".json"));

    if (jsonFiles.length === 0) {
      toast(t("custom.import.errorFormat"), "error");
      return;
    }

    const capacity = CUSTOM_ACTIVITIES_MAX - state.customActivities.items.length;

    if (capacity <= 0) {
      toast(t("custom.toast.limit"), "error");
      return;
    }

    importingRef.current = true;
    setImporting(true);

    try {
      const outcomes: FileOutcome[] = [];
      let importedCount = 0;

      for (const file of jsonFiles) {
        if (importedCount >= capacity) {
          outcomes.push({
            ok: false,
            message: "custom.toast.limit"
          });
          break;
        }

        const outcome = await importFile(file);
        outcomes.push(outcome);
        if (outcome.ok) importedCount += 1;
      }

      await refresh.customActivities();
      const imported = outcomes.flatMap((outcome) => (outcome.ok ? [outcome] : []));
      const failed = outcomes.flatMap((outcome) => (outcome.ok ? [] : [outcome]));
      if (failed.length > 0) toast(t(failed[0].message), "error");
      if (imported.length === 0) return;

      toast(
        imported.length === 1
          ? t("custom.toast.imported", { name: imported[0].activity.name })
          : t("custom.toast.importedMany", { count: imported.length })
      );
      if (imported.some((outcome) => outcome.imageSkipped)) toast(t("custom.import.imageSkipped"), "info");
      if (imported.length === 1) onImported(imported[0].activity);
    } catch {
      toast(t("error.generic"), "error");
    } finally {
      importingRef.current = false;
      setImporting(false);
    }
  }, [state.customActivities.items.length, refresh, toast, t, onImported]);

  return { importing, exportActivity, importFiles };
};
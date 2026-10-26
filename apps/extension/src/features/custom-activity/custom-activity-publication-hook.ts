import { useEffect, useState } from "react";
import { useI18n } from "@/hooks/i18n-provider";
import { sendMessage } from "@/lib/messages";
import { useExtensionState } from "@/hooks/extension-state-provider";

export const useCustomActivityPublication = (id: string) => {
  const { t } = useI18n();
  const { state } = useExtensionState();
  const savedActivity = state.customActivities.items.find((activity) => activity.id === id);
  const [hasChanges, setHasChanges] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [creatorRequired, setCreatorRequired] = useState(false);
  const [revision, setRevision] = useState<number | null>(null);

  const showFailure = (code: string) => {
    if (code === "CREATOR_REQUIRED") setCreatorRequired(true);
    setError(code === "CREATOR_REQUIRED" ? null : t(code === "REVISION_CONFLICT" ? "custom.public.conflict" : "error.generic"));
  };

  useEffect(() => {
    let cancelled = false;
    setHasChanges(null);
    const load = () =>
      void sendMessage("GET_OWN_ACTIVITY_PUBLICATION", { id })
        .then((result) => {
          if (cancelled) return;
          if (!result.ok) {
            if (result.error === "CREATOR_REQUIRED") setCreatorRequired(true);
            setError(result.error === "CREATOR_REQUIRED" ? null : t(result.error === "REVISION_CONFLICT" ? "custom.public.conflict" : "error.generic"));
            return;
          }

          setRevision(result.url ? result.revision : 0);
          setError(null);
          setCreatorRequired(false);
          setUrl(result.url);
          setPublished(result.url ? result.published : false);
          setHasChanges(result.url ? (result.hasChanges ?? null) : true);
        })
        .catch(() => {
          if (!cancelled) setError(t("error.generic"));
        });
    load();
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
    };
  }, [id, savedActivity, t]);

  const publish = async (unpublish = false) => {
    if (revision === null || busy || creatorRequired || (!unpublish && published && hasChanges !== true)) return;

    setBusy(true);
    setError(null);

    try {
      const result = await sendMessage("PUBLISH_CUSTOM_ACTIVITY", {
        id,
        baseRevision: revision,
        unpublish
      });

      if (!result.ok) {
        showFailure(result.error);
        return;
      }

      setUrl(result.url);
      setRevision(result.revision);
      setPublished(result.published);
      setCreatorRequired(false);
      setHasChanges(unpublish);
    } catch {
      setError(t("error.generic"));
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const result = await sendMessage("START_CREATOR_CONNECT");
      if (!result.ok) setError(t("error.generic"));
    } catch {
      setError(t("error.generic"));
    } finally {
      setBusy(false);
    }
  };

  return { busy, url, error, published, creatorRequired, revision, hasChanges, publish, connect };
};
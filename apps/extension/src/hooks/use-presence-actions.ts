import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { useToast } from "@/ui/toast";
import { useI18n, type Translate } from "@/hooks/i18n-provider";
import { sendMessage } from "@/lib/messages";
import { useExtensionState } from "@/hooks/extension-state-provider";
import type { PresenceSchedule } from "@/shared/types";
import { presenceMutations } from "@/hooks/presence-mutations";

const errorMessage = (error: string | undefined, t: Translate): string => {
  switch (error) {
    case "RELEASE_SIGNATURE_INVALID":
    case "RELEASE_SIGNATURE_MISSING":
    case "BUNDLE_HASH_MISMATCH":
    case "METADATA_HASH_MISMATCH":
      return t("error.signature");
    case "PRESENCE_NOT_FOUND":
      return t("error.notFound");
    default:
      return t("error.generic");
  }
};

export const usePresenceActions = () => {
  const { state, refresh } = useExtensionState();
  const { toast } = useToast();
  const { t } = useI18n();
  const pendingSlugs = useSyncExternalStore(presenceMutations.subscribe, presenceMutations.getSnapshot, presenceMutations.getSnapshot);
  const pending = pendingSlugs.values().next().value ?? null;
  const [updatingAll, setUpdatingAll] = useState(false);
  const batchInFlight = useRef(false);
  const availableUpdates = Object.entries(state.presences).filter(
    ([slug, stored]) => stored.source !== "local" && stored.source !== "bundle" && Boolean(state.updates[slug])
  );

  const install = useCallback((slug: string, name: string) =>
    presenceMutations.write(slug, async (isCurrent) => {
      try {
        const result = await sendMessage("INSTALL_PRESENCE_FROM_API", { slug });
        await refresh.presences();

        if (isCurrent()) {
          if (result.ok) toast(t("toast.installed", { name }));
          else if (result.queued) toast(t("toast.queued", { name }), "info");
          else toast(errorMessage(result.error, t), "error");
        }

        return result.ok;
      } catch {
        await Promise.allSettled([
          refresh.presences(),
          refresh.updates()
        ]);
        if (isCurrent()) toast(t("error.generic"), "error");
        return false;
      }
    }), [refresh, toast, t]);

  const update = useCallback((slug: string, name: string, revision = presenceMutations.revision(slug)) =>
    presenceMutations.write(
      slug,
      async (isCurrent) => {
        try {
          const updates = await sendMessage("CHECK_UPDATES");

          if (!isCurrent()) return;

          const installed = await sendMessage("GET_PRESENCES");

          const stored = installed[slug];

          if (
            !isCurrent() ||
            !stored ||
            stored.source === "local" ||
            stored.source === "bundle" ||
            !updates[slug] ||
            stored.release.version === updates[slug]
          ) return;

          const result = await sendMessage("INSTALL_PRESENCE_FROM_API", { slug });
          await Promise.all([
            refresh.presences(),
            refresh.updates()
          ]);
          if (isCurrent()) toast(result.ok ? t("toast.updated", { name }) : errorMessage(result.error, t), result.ok ? "success" : "error");
          return result.ok;
        } catch {
          await Promise.allSettled([
            refresh.presences(),
            refresh.updates()
          ]);
          if (isCurrent()) toast(t("error.generic"), "error");
          return false;
        }
      },
      revision
    ), [refresh, toast, t]);

  const updateAll = async () => {
    if (batchInFlight.current || availableUpdates.length < 2) return;

    const snapshot = availableUpdates.map(([slug, stored]) => ({
      slug,
      name: stored.metadata.name,
      revision: presenceMutations.revision(slug)
    }));
    batchInFlight.current = true;
    setUpdatingAll(true);
    const succeeded: string[] = [];
    const failed: string[] = [];

    try {
      for (const { slug, name, revision } of snapshot) {
        try {
          const result = await update(slug, name, revision);
          if (result === true) succeeded.push(slug);
          else if (result === false) failed.push(slug);
        } catch {
          failed.push(slug);
          await Promise.allSettled([
            refresh.presences(),
            refresh.updates()
          ]);
          toast(t("error.generic"), "error");
        }
      }

      return { succeeded, failed };
    } finally {
      batchInFlight.current = false;
      setUpdatingAll(false);
    }
  };

  const uninstall = useCallback((slug: string, name: string) =>
    presenceMutations.remove(slug, async () => {
      try {
        const result = await sendMessage("UNINSTALL_PRESENCE", { slug });
        await Promise.all([
          refresh.presences(),
          refresh.updates()
        ]);
        toast(result.ok ? t("toast.uninstalled", { name }) : t("error.generic"), result.ok ? "info" : "error");
      } catch {
        await Promise.allSettled([
          refresh.presences(),
          refresh.updates()
        ]);
        toast(t("error.generic"), "error");
      }
    }), [refresh, toast, t]);

  const toggle = useCallback(async (slug: string, enabled: boolean) => {
    const result = await sendMessage("TOGGLE_PRESENCE", { slug, enabled });
    await refresh.presences();
    if (!result.ok) toast(
      result.error === "PRESENCE_NO_VALID_URL_PATTERNS"
        ? t("error.generic")
        : t("error.toggle"),
      "error"
    );
  }, [refresh, toast, t]);

  const snooze = useCallback(async (slug: string, durationMs: number) => {
    await sendMessage("SNOOZE_PRESENCE", {
      slug,
      duration: durationMs
    });
    await refresh.presences();
  }, [refresh]);

  const clearSnooze = useCallback(async (slug: string) => {
    await sendMessage("CLEAR_SNOOZE", { slug });
    await refresh.presences();
  }, [refresh]);

  const setSchedule = useCallback(async (slug: string, schedule: PresenceSchedule | undefined) => {
    await sendMessage("SET_PRESENCE_SCHEDULE", { slug, schedule });
    await refresh.presences();
  }, [refresh]);

  return {
    pending,
    isPending: (slug: string) => pendingSlugs.has(slug),
    availableUpdates,
    updatingAll,
    updateAll,
    install,
    update,
    uninstall,
    toggle,
    snooze,
    clearSnooze,
    setSchedule
  };
};
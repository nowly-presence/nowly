import { useState } from "react";
import { useI18n } from "@/hooks/i18n-provider";
import { adminErrorKey } from "@/lib/admin-error";
import { sendMessage } from "@/lib/messages";
import { useToast } from "@/ui/toast";

type Busy = "hide" | "show" | "delete" | null;

export const usePresenceModeration = (onDone: () => void) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [busy, setBusy] = useState<Busy>(null);

  const run = async (kind: Exclude<Busy, null>, slug: string, success: "admin.presence.hidden" | "admin.presence.shown" | "admin.presence.deleted") => {
    setBusy(kind);
    const result =
      kind === "delete"
        ? await sendMessage("ADMIN_DELETE_PRESENCE", { slug })
        : await sendMessage("ADMIN_SET_PRESENCE_HIDDEN", {
            slug,
            hidden: kind === "hide"
          });
    setBusy(null);

    if (!result.ok) {
      toast(result.message ?? t(adminErrorKey(result.error)), "error");
      return;
    }

    toast(t(success), "success");
    onDone();
  };

  return {
    busy,
    hide: (slug: string) => run("hide", slug, "admin.presence.hidden"),
    show: (slug: string) => run("show", slug, "admin.presence.shown"),
    remove: (slug: string) => run("delete", slug, "admin.presence.deleted")
  };
};

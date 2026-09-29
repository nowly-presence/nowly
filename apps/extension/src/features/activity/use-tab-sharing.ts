import { useCallback } from "react"
import { useI18n } from "@/hooks/i18n-provider"
import { sendMessage } from "@/lib/messages"
import { useToast } from "@/ui/toast"

export const useTabSharing = () => {
  const { t } = useI18n()
  const { toast } = useToast()

  return useCallback(
    async (tabId: number, muted: boolean) => {
      await sendMessage("SET_TAB_MUTED", { tabId, muted })
      toast(muted ? t("toast.tabHidden") : t("toast.tabShared"), "info")
    },
    [t, toast],
  )
}

import { useCallback, useState } from "react"
import { useToast } from "@/ui/toast"
import { useI18n, type Translate } from "@/hooks/i18n-provider"
import { sendMessage, track } from "@/lib/messages"
import { useExtensionState } from "@/hooks/extension-state-provider"
import type { PresenceSchedule } from "@/shared/types"

const errorMessage = (error: string | undefined, t: Translate): string => {
  switch (error) {
    case "RELEASE_SIGNATURE_INVALID":
    case "RELEASE_SIGNATURE_MISSING":
    case "BUNDLE_HASH_MISMATCH":
    case "METADATA_HASH_MISMATCH":
      return t("error.signature")
    case "PRESENCE_NOT_FOUND":
      return t("error.notFound")
    default:
      return t("error.generic")
  }
}

export const usePresenceActions = () => {
  const { refresh } = useExtensionState()
  const { toast } = useToast()
  const { t, locale } = useI18n()
  const [pending, setPending] = useState<string | null>(null)

  const run = useCallback(async <T,>(slug: string, action: () => Promise<T>): Promise<T | undefined> => {
    setPending(slug)
    try {
      return await action()
    } finally {
      setPending((current) => (current === slug ? null : current))
    }
  }, [])

  const install = useCallback(
    (slug: string, name: string) =>
      run(slug, async () => {
        track("marketplace_install_click", { slug, source: "extension_library", payload: { locale } })
        const result = await sendMessage("INSTALL_PRESENCE_FROM_API", { slug })
        await refresh.presences()
        if (result.ok) toast(t("toast.installed", { name }))
        else if (result.queued) toast(t("toast.queued", { name }), "info")
        else toast(errorMessage(result.error, t), "error")
        return result.ok
      }),
    [run, refresh, toast, t, locale],
  )

  const update = useCallback(
    (slug: string, name: string) =>
      run(slug, async () => {
        const result = await sendMessage("INSTALL_PRESENCE_FROM_API", { slug })
        await Promise.all([refresh.presences(), refresh.updates()])
        toast(result.ok ? t("toast.updated", { name }) : errorMessage(result.error, t), result.ok ? "success" : "error")
        return result.ok
      }),
    [run, refresh, toast, t],
  )

  const uninstall = useCallback(
    (slug: string, name: string) =>
      run(slug, async () => {
        await sendMessage("UNINSTALL_PRESENCE", { slug })
        await refresh.presences()
        toast(t("toast.uninstalled", { name }), "info")
      }),
    [run, refresh, toast, t],
  )

  const toggle = useCallback(
    async (slug: string, enabled: boolean) => {
      const result = await sendMessage("TOGGLE_PRESENCE", { slug, enabled })
      await refresh.presences()
      if (!result.ok) toast(result.error === "PRESENCE_NO_VALID_URL_PATTERNS" ? t("error.generic") : t("error.toggle"), "error")
    },
    [refresh, toast, t],
  )

  const snooze = useCallback(
    async (slug: string, durationMs: number) => {
      await sendMessage("SNOOZE_PRESENCE", { slug, duration: durationMs })
      await refresh.presences()
    },
    [refresh],
  )

  const clearSnooze = useCallback(
    async (slug: string) => {
      await sendMessage("CLEAR_SNOOZE", { slug })
      await refresh.presences()
    },
    [refresh],
  )

  const setSchedule = useCallback(
    async (slug: string, schedule: PresenceSchedule | undefined) => {
      await sendMessage("SET_PRESENCE_SCHEDULE", { slug, schedule })
      await refresh.presences()
    },
    [refresh],
  )

  return { pending, install, update, uninstall, toggle, snooze, clearSnooze, setSchedule }
}

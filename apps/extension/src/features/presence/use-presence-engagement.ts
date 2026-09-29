import { useCallback, useEffect, useState } from "react"
import type { PresenceEngagement } from "@/background/router/contracts"
import { useI18n } from "@/hooks/i18n-provider"
import { sendMessage, track } from "@/lib/messages"

export const usePresenceEngagement = (slug: string, fallback: { likes?: number; activeUsers?: number; totalInstalls?: number }) => {
  const { locale } = useI18n()
  const [engagement, setEngagement] = useState<PresenceEngagement | null>(null)

  useEffect(() => {
    let cancelled = false
    sendMessage("GET_PRESENCE_ENGAGEMENT", { slug })
      .then((value) => {
        if (!cancelled) setEngagement(value)
      })
      .catch(() => setEngagement(null))
    track("marketplace_page_view", { slug, source: "extension_library", payload: { locale } })
    return () => {
      cancelled = true
    }
  }, [slug, locale])

  const likes = engagement?.likeCount ?? fallback.likes ?? 0
  const activeUsers = engagement?.activeUsers ?? fallback.activeUsers ?? 0
  const totalInstalls = engagement?.totalInstalls ?? fallback.totalInstalls ?? 0
  const liked = engagement?.liked ?? false

  const toggleLike = useCallback(async () => {
    const next = !liked
    setEngagement({ liked: next, likeCount: Math.max(0, likes + (next ? 1 : -1)), totalInstalls, activeUsers })
    const result = await sendMessage("SET_PRESENCE_LIKE", { slug, liked: next })
    setEngagement((current) => {
      if (!current) return current
      return result.ok ? { ...current, likeCount: result.count } : { ...current, liked, likeCount: likes }
    })
  }, [slug, liked, likes, totalInstalls, activeUsers])

  return { liked, likes, activeUsers, totalInstalls, toggleLike }
}

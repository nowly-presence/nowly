import { useCallback, useEffect, useState } from "react"
import { sendMessage } from "@/lib/messages"

export type PresenceEngagementState = {
  liked: boolean
  likeCount: number
  totalInstalls: number
  activeUsers: number
  isLoading: boolean
}

export const usePresenceEngagement = (slug: string): PresenceEngagementState & { toggleLike: () => void; refetch: () => void } => {
  const [state, setState] = useState<PresenceEngagementState>({
    liked: false,
    likeCount: 0,
    totalInstalls: 0,
    activeUsers: 0,
    isLoading: true,
  })

  const fetchEngagement = useCallback(() => {
    let cancelled = false
    setState((current) => ({ ...current, isLoading: true }))
    void sendMessage("GET_PRESENCE_ENGAGEMENT", { slug }).then((result) => {
      if (cancelled) return
      setState({ ...result, isLoading: false })
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => fetchEngagement(), [fetchEngagement])

  const toggleLike = useCallback(() => {
    setState((current) => ({ ...current, liked: !current.liked, likeCount: current.likeCount + (current.liked ? -1 : 1) }))
    void sendMessage("SET_PRESENCE_LIKE", { slug, liked: !state.liked }).then((result) => {
      if (!result.ok) return
      setState((current) => ({ ...current, likeCount: result.count }))
    })
  }, [slug, state.liked])

  return { ...state, toggleLike, refetch: fetchEngagement }
}

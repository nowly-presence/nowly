import { useEffect, useState } from "react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useFeatureReveals } from "@/hooks/feature-reveal-provider"
import { useNav } from "@/hooks/navigation-provider"
import { sendMessage } from "@/lib/messages"
import { discordIpcIssueOf, shouldPromptDiscordIpcIssue } from "@/shared/discord-ipc-prompt"

const SHOW_DELAY_MS = 1500

export const DiscordIpcPrompt = () => {
  const { state, patch } = useExtensionState()
  const { activeId } = useFeatureReveals()
  const { stack, push } = useNav()
  const [handled, setHandled] = useState(false)
  const issue = discordIpcIssueOf(state.native)
  const onPage = stack.some((route) => route.name === "discord-ipc")
  const due = state.ready && !handled && shouldPromptDiscordIpcIssue(issue, activeId !== null)

  useEffect(() => {
    if (!issue.active) setHandled(false)
  }, [issue.active])

  useEffect(() => {
    if (!due) return
    const timer = window.setTimeout(() => {
      setHandled(true)
      if (!onPage) push({ name: "discord-ipc" })
      void sendMessage("ACKNOWLEDGE_DISCORD_IPC_ISSUE")
        .then((native) => patch({ native }))
        .catch(() => {})
    }, SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [due, onPage, push, patch])

  return null
}

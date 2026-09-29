import { useState } from "react"
import { RiDiscordFill } from "@remixicon/react"
import type { DiscordProfileSnapshot } from "@/shared/types"
import { cn } from "@/ui/cn"

export const DiscordAvatar = ({ profile, size = 36, className }: { profile?: DiscordProfileSnapshot | null; size?: number; className?: string }) => {
  const [failed, setFailed] = useState(false)
  const src = profile?.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=128` : null
  if (!src || failed) {
    return (
      <span style={{ width: size, height: size }} className={cn("flex shrink-0 items-center justify-center rounded-full bg-[#5865F2] text-white", className)}>
        <RiDiscordFill style={{ width: size * 0.55, height: size * 0.55 }} />
      </span>
    )
  }
  return <img src={src} alt="" style={{ width: size, height: size }} onError={() => setFailed(true)} className={cn("shrink-0 rounded-full object-cover", className)} />
}

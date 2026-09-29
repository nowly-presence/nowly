import { useState } from "react"
import { assetUrl, type PresenceAssetType } from "@/shared/presence-assets"
import { cn } from "@/ui/cn"

type PresenceIconProps = {
  slug: string
  name: string
  color?: string
  size?: number
  asset?: Extract<PresenceAssetType, "logo" | "icon">
  className?: string
  rounded?: string
}

export const PresenceIcon = ({ slug, name, color, size = 36, asset = "logo", className, rounded = "rounded-sm" }: PresenceIconProps) => {
  const [failed, setFailed] = useState(() => slug.startsWith("__"))
  const style = { width: size, height: size }

  if (failed) {
    return (
      <span
        style={{ ...style, backgroundColor: color ?? "var(--primary)", fontSize: Math.round(size * 0.42) }}
        className={cn("flex shrink-0 items-center justify-center font-medium text-white", rounded, className)}
        aria-hidden
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      src={assetUrl(slug, asset)}
      alt=""
      style={style}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn("shrink-0 bg-hover object-cover", rounded, className)}
    />
  )
}


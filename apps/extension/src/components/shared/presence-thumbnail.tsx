import { useState } from "react"
import { assetUrl } from "@/shared/presence-assets"
import { cn } from "@/ui/cn"

export const PresenceThumbnail = ({ slug, color, className }: { slug: string; color?: string; className?: string }) => {
  const [failed, setFailed] = useState(false)
  return (
    <div className={cn("relative overflow-hidden bg-tertiary", className)}>
      {!failed && (
        <img
          src={assetUrl(slug, "thumbnail")}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {failed && (
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(120% 90% at 20% 10%, ${color ?? "#0891b2"}66 0%, transparent 60%), var(--tertiary)` }}
        />
      )}
    </div>
  )
}

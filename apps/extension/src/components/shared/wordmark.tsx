import { useState } from "react"
import { brandLockup, IS_CANARY } from "@/shared/brand"
import { cn } from "@/ui/cn"

export const Wordmark = ({ theme, className }: { theme: "light" | "dark"; className?: string }) => {
  const [failed, setFailed] = useState(false)
  const variant = IS_CANARY ? "canary" : theme === "dark" ? "white" : "blue"

  if (failed) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-[19px] leading-none font-medium tracking-[-0.4px] text-ink", className)}>
        <span className="size-2 rounded-full bg-primary" aria-hidden />
        nowly
      </span>
    )
  }
  return <img src={brandLockup(variant)} alt="Nowly" className={cn("w-auto select-none", IS_CANARY ? "h-[30px]" : "h-[22px]", className)} draggable={false} onError={() => setFailed(true)} />
}

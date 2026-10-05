import type { ReactNode } from "react"
import { RiComputerLine, RiDiscordFill, RiLinkM, RiLinkUnlinkM, RiShieldUserFill } from "@remixicon/react"
import { cn } from "@/ui/cn"

const Tile = ({ children, badge }: { children: ReactNode; badge?: ReactNode }) => (
  <span className="relative flex size-14 items-center justify-center rounded-lg border border-line bg-surface text-ink">
    {children}
    {badge && (
      <span className="absolute -right-2 -bottom-2 flex size-7 items-center justify-center rounded-full border border-line bg-surface text-danger">{badge}</span>
    )}
  </span>
)

const Wire = () => <span className="h-px w-5 bg-line-strong" />

export const DiscordIpcHero = ({ resolved, title, description }: { resolved: boolean; title: string; description: string }) => (
  <div className="flex flex-col items-center gap-5 pt-4 text-center">
    <div className="flex items-center gap-2" aria-hidden>
      <Tile>
        <RiComputerLine className="size-6" />
      </Tile>
      <Wire />
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-full transition-colors duration-300",
          resolved ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
        )}
      >
        {resolved ? <RiLinkM className="size-[18px]" /> : <RiLinkUnlinkM className="size-[18px]" />}
      </span>
      <Wire />
      <Tile badge={resolved ? undefined : <RiShieldUserFill className="size-3.5" />}>
        <RiDiscordFill className="size-6" />
      </Tile>
    </div>
    <div className="flex max-w-sm flex-col gap-2">
      <h1 className="text-headline-sm font-medium tracking-[-0.3px] text-ink">{title}</h1>
      <p className="text-body-sm text-muted">{description}</p>
    </div>
  </div>
)

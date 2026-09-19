import { RiDiscordFill, RiDownload2Line, RiExternalLinkLine, RiGlobalLine, RiMoreLine, RiPauseLine, RiPlayLine, RiRefreshLine, RiRestartLine } from "@remixicon/react"
import { PresenceLayoutToggle } from "@/features/activity/presence-layout-toggle"
import { Button } from "@/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/dropdown-menu"
import { cn } from "@/ui/utils"
import { BRAND_LOCKUP } from "@/shared/brand"
import { DISCORD_INVITE_URL, HOST_DOWNLOAD_URL, WEB_BASE_URL } from "@/shared/constants"
import { t } from "@/shared/i18n"
import { openUrl } from "@/shared/browser-links"
import type { PresenceDisplayMode } from "@/shared/types"

type Props = {
  displayMode?: PresenceDisplayMode
  isCheckingUpdates?: boolean
  onCheckUpdates?: () => void
  onDisplayModeChange?: (mode: PresenceDisplayMode) => void
  onReplayOnboarding?: () => void
  onTogglePause?: () => void
  presencePaused?: boolean
}

type MenuItem = {
  external?: boolean
  icon: typeof RiGlobalLine
  id: string
  label: Parameters<typeof t>[0]
  onSelect: () => void
}

export const Header = ({ displayMode, isCheckingUpdates = false, onCheckUpdates, onDisplayModeChange, onReplayOnboarding, onTogglePause, presencePaused = false }: Props): React.JSX.Element => {
  const items: MenuItem[] = [
    { id: "website", icon: RiGlobalLine, label: "menu-website", external: true, onSelect: () => openUrl(WEB_BASE_URL) },
    { id: "host", icon: RiDownload2Line, label: "menu-host", external: true, onSelect: () => openUrl(HOST_DOWNLOAD_URL) },
    { id: "discord", icon: RiDiscordFill, label: "menu-discord", external: true, onSelect: () => openUrl(DISCORD_INVITE_URL) },
  ]

  if (onCheckUpdates) items.push({ id: "updates", icon: RiRefreshLine, label: "check-updates", onSelect: onCheckUpdates })
  if (onReplayOnboarding) items.push({ id: "onboarding", icon: RiRestartLine, label: "menu-onboarding", onSelect: () => onReplayOnboarding() })

  return (
    <header className="flex items-center justify-between gap-3">
      <img src={BRAND_LOCKUP} alt={chrome.i18n.getMessage("extensionName") || "Nowly"} className="ml-2 h-[53px] w-auto min-w-0" />
      <div className="mr-2 flex shrink-0 items-center gap-1.5">
        {displayMode && onDisplayModeChange ? <PresenceLayoutToggle value={displayMode} onChange={onDisplayModeChange} /> : null}
        {onTogglePause ? (
          <Button
            variant="outline"
            size="icon-sm"
            aria-pressed={presencePaused}
            aria-label={presencePaused ? t("presence-pause-resume") : t("presence-pause")}
            onClick={onTogglePause}
            className={cn(presencePaused && "bg-warning/15 text-warning hover:bg-warning/25")}
          >
            {presencePaused ? <RiPlayLine /> : <RiPauseLine />}
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" aria-label={t("more")} />}>
            <RiMoreLine />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            {items.map((item) => {
              const spinning = item.id === "updates" && isCheckingUpdates
              return (
                <DropdownMenuItem key={item.id} disabled={spinning} onClick={item.onSelect}>
                  <item.icon className={cn("size-4 shrink-0 text-muted-foreground", spinning && "animate-spin")} />
                  <span className="min-w-0 flex-1">{t(item.label)}</span>
                  {item.external ? <RiExternalLinkLine className="size-3.5 shrink-0 text-muted-foreground" /> : null}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

import { cn } from "@/ui/utils"
import { t } from "@/shared/i18n"
import type { NativeStatus } from "@/shared/types"

type Props = {
  nativeStatus: NativeStatus
  onConnect: () => void
  presencePaused?: boolean
  hostUpdateAvailable?: boolean
  visible: boolean
}

type Tone = { stripe: string; label: string; actionable: boolean }

export const isConnectionHealthy = (ns: NativeStatus): boolean => Boolean(ns.discordConnected)

const toneFor = (ns: NativeStatus, presencePaused: boolean, hostUpdateAvailable: boolean): Tone => {
  if (presencePaused) return { stripe: "bg-warning", label: t("status-bar-presence-paused"), actionable: false }
  if (hostUpdateAvailable && ns.connected) return { stripe: "bg-warning", label: t("status-bar-host-outdated"), actionable: true }
  if (ns.discordConnected) return { stripe: "bg-accent", label: t("status-bar-discord-connected"), actionable: false }
  if (ns.connected && !ns.discordConnected) return { stripe: "bg-warning", label: t("status-bar-discord-closed"), actionable: false }
  if (ns.status === "connecting") return { stripe: "bg-muted-foreground", label: t("status-bar-checking"), actionable: false }
  return { stripe: "bg-destructive", label: t("status-bar-host-missing"), actionable: true }
}

export const ConnectionStatusBar = ({ nativeStatus, onConnect, presencePaused = false, hostUpdateAvailable = false, visible }: Props): React.JSX.Element => {
  const tone = toneFor(nativeStatus, presencePaused, hostUpdateAvailable)

  return (
    <div className={cn("grid shrink-0 transition-[grid-template-rows] duration-300 ease-out", visible ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
      <div className="overflow-hidden">
        <button
          type="button"
          disabled={!tone.actionable}
          onClick={tone.actionable ? onConnect : undefined}
          aria-hidden={!visible}
          aria-label={tone.label}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium text-foreground",
            tone.actionable ? "cursor-pointer hover:bg-muted" : "cursor-default",
          )}
        >
          <span aria-hidden className={cn("size-2 shrink-0 rounded-full", tone.stripe)} />
          <span className="flex-1 text-left">{tone.label}</span>
        </button>
      </div>
    </div>
  )
}

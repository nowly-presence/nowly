import { RiPauseLine, RiPlayFill } from "@remixicon/react"
import { Wordmark } from "@/components/shared/wordmark"
import { cn } from "@/ui/cn"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import { connectionOf } from "@/lib/presence-status"
import { useExtensionState } from "@/hooks/extension-state-provider"

const dotClass = {
  discord: "bg-success",
  "no-discord": "bg-muted",
  connecting: "bg-muted animate-pulse",
  "no-host": "bg-danger",
}

export const Header = ({ theme }: { theme: "light" | "dark" }) => {
  const { state, updateSettings } = useExtensionState()
  const { t } = useI18n()
  const { push } = useNav()
  const connection = connectionOf(state.native)
  const paused = state.settings.presencePaused === true

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 bg-canvas/90 px-4 backdrop-blur-md">
      <Wordmark theme={theme} />
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => push({ name: "connection" })}
          className="flex h-8 items-center gap-2 rounded-full border border-line bg-surface px-3 text-label-md font-medium text-ink transition-colors hover:border-line-strong"
        >
          <span className={cn("size-1.5 rounded-full", dotClass[connection])} />
          {t(`header.${connection}`)}
        </button>
        <button
          type="button"
          onClick={() => void updateSettings({ presencePaused: !paused })}
          aria-pressed={paused}
          aria-label={paused ? t("action.resume") : t("header.pause")}
          title={paused ? t("action.resume") : t("header.pause")}
          className={cn(
            "flex size-8 items-center justify-center rounded-full border transition-colors",
            paused ? "border-ink bg-ink text-canvas" : "border-line bg-surface text-ink hover:border-line-strong",
          )}
        >
          {paused ? <RiPlayFill className="size-4" /> : <RiPauseLine className="size-4" />}
        </button>
      </div>
    </header>
  )
}

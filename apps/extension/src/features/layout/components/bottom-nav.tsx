import { RiFileList3Line, RiHomeLine, RiSettings3Line, RiShoppingBag3Line } from "@remixicon/react"
import { t } from "@/shared/i18n"
import type { PersistedAppView } from "@/shared/types"
import { cn } from "@/ui/utils"

type Props = {
  activeView: PersistedAppView | "logs"
  onViewChange: (view: PersistedAppView | "logs") => void
  developerModeEnabled: boolean
}

const TABS: { view: PersistedAppView | "logs"; icon: typeof RiHomeLine; label: Parameters<typeof t>[0] }[] = [
  { view: "activity", icon: RiHomeLine, label: "nav-home" },
  { view: "store", icon: RiShoppingBag3Line, label: "nav-store" },
  { view: "settings", icon: RiSettings3Line, label: "nav-settings" },
]

export const BottomNav = ({ activeView, onViewChange, developerModeEnabled }: Props): React.JSX.Element => (
  <nav className="shrink-0 px-3 pb-3">
    <div
      role="tablist"
      aria-label={t("nav-tablist")}
      className={cn("grid gap-1 rounded-xl border border-border bg-card p-1", developerModeEnabled ? "grid-cols-4" : "grid-cols-3")}
    >
      {[
        ...TABS,
        ...(developerModeEnabled ? [{ view: "logs" as const, icon: RiFileList3Line, label: "runtime-logs-title" as const }] : []),
      ].map(({ view, icon: Icon, label }) => {
        const active = view === activeView
        return (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onViewChange(view)}
            className={cn(
              "flex flex-col items-center gap-[5px] rounded-lg py-2 text-muted-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active ? "bg-accent/10 text-accent" : "hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <Icon className="size-5" />
            <span className="text-xs font-medium leading-none">{t(label)}</span>
          </button>
        )
      })}
    </div>
  </nav>
)

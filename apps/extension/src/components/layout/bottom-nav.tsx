import { RiHomeLine, RiSettings3Line, RiShoppingBag3Line } from "@remixicon/react"
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs"
import { t } from "@/shared/i18n"
import type { PersistedAppView } from "@/shared/types"

type Props = {
  activeView: PersistedAppView
  onViewChange: (view: PersistedAppView) => void
}

const TABS: { view: PersistedAppView; icon: typeof RiHomeLine; label: Parameters<typeof t>[0] }[] = [
  { view: "activity", icon: RiHomeLine, label: "nav-home" },
  { view: "store", icon: RiShoppingBag3Line, label: "nav-store" },
  { view: "settings", icon: RiSettings3Line, label: "nav-settings" },
]

export const BottomNav = ({ activeView, onViewChange }: Props): React.JSX.Element => (
  <nav className="shrink-0 px-3 pb-3">
    <Tabs value={activeView} onValueChange={(value) => onViewChange(value as PersistedAppView)}>
      <TabsList aria-label={t("nav-tablist")} className="grid h-auto w-full grid-cols-3 rounded-xl border border-border bg-card p-1">
        {TABS.map(({ view, icon: Icon, label }) => (
          <TabsTrigger key={view} value={view} className="flex-col gap-1 py-2 data-active:text-accent data-active:bg-transparent">
            <Icon className="size-5" />
            <span className="text-xs font-medium leading-none">{t(label)}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  </nav>
)

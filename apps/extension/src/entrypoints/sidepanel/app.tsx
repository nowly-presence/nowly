import { useEffect, useRef, useState } from "react"
import { RiApps2Fill, RiApps2Line, RiPulseFill, RiPulseLine, RiSettings3Fill, RiSettings3Line } from "@remixicon/react"
import { Dock } from "@/features/layout/dock"
import { useResolvedTheme } from "@/hooks/use-theme"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav, type Route, type Tab } from "@/hooks/navigation-provider"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { ActivityView } from "@/features/activity/activity-view"
import { ConnectionView } from "@/features/diagnostics/connection-view"
import { LibraryView } from "@/features/library/library-view"
import { RuntimeLogsView } from "@/features/runtime-logs/runtime-logs-view"
import { OnboardingView } from "@/features/onboarding/onboarding-view"
import { PresenceDetailView } from "@/features/presence/presence-detail-view"
import { SettingsView } from "@/features/settings/settings-view"
import { Header } from "@/features/layout/header"
import { Layer } from "@/features/layout/layer"
import { ReviewPrompt } from "@/features/review/review-prompt"
import { HalloweenPrank } from "@/features/seasonal/halloween-prank"

const TABS: Tab[] = ["activity", "store", "settings"]

const routeKey = (route: Route, depth: number) => `${depth}:${JSON.stringify(route)}`

export const App = () => {
  const { state } = useExtensionState()
  const { t } = useI18n()
  const { tab, stack, setTab } = useNav()
  const theme = useResolvedTheme(state.settings.appearance)
  const mainRef = useRef<HTMLElement>(null)
  const [visited, setVisited] = useState<Set<Tab>>(() => new Set([tab]))

  useEffect(() => {
    setVisited((current) => (current.has(tab) ? current : new Set(current).add(tab)))
  }, [tab])

  const onboarding = state.ready && (!state.onboarding.onboardingCompleted || state.onboarding.devReplayOnboarding)

  if (onboarding) {
    return (
      <main className="scroll-thin h-full overflow-y-auto">
        <OnboardingView theme={theme} />
      </main>
    )
  }

  const live = Boolean(state.activity) && !state.settings.presencePaused

  const selectTab = (next: Tab) => {
    if (next === tab && stack.length === 0) {
      mainRef.current?.querySelector<HTMLElement>(`[data-tab="${next}"]`)?.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    setTab(next)
  }

  return (
    <main ref={mainRef} className="relative h-full overflow-hidden">
      {TABS.filter((value) => visited.has(value)).map((value) => (
        <Layer key={value} tab={value} active={stack.length === 0 && value === tab}>
          <Header theme={theme} />
          {value === "activity" && <ActivityView />}
          {value === "store" && <LibraryView />}
          {value === "settings" && <SettingsView />}
        </Layer>
      ))}
      {stack.map((route, depth) => (
        <Layer key={routeKey(route, depth)} active={depth === stack.length - 1} className="animate-push bg-canvas">
          {route.name === "presence" && <PresenceDetailView slug={route.slug} />}
          {route.name === "connection" && <ConnectionView />}
          {route.name === "logs" && <RuntimeLogsView />}
        </Layer>
      ))}
      <Dock<Tab>
        label={t("nav.label")}
        value={tab}
        onChange={selectTab}
        items={[
          { value: "activity", label: t("nav.activity"), icon: <RiPulseLine className="size-[18px]" />, activeIcon: <RiPulseFill className="size-[18px]" />, badge: live ? "live" : undefined },
          { value: "store", label: t("nav.library"), icon: <RiApps2Line className="size-[18px]" />, activeIcon: <RiApps2Fill className="size-[18px]" /> },
          { value: "settings", label: t("nav.settings"), icon: <RiSettings3Line className="size-[18px]" />, activeIcon: <RiSettings3Fill className="size-[18px]" /> },
        ]}
      />
      <ReviewPrompt />
      <HalloweenPrank />
    </main>
  )
}

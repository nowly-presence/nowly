import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  clearPendingSidepanelNav,
  loadPendingSidepanelNav,
  loadPersistedAppView,
  persistAppView,
  SIDEPANEL_NAV_KEY,
} from "@/shared/sidepanel-view"
import type { PersistedAppView } from "@/shared/types"

export type Tab = PersistedAppView

export type Route =
  | { name: "presence"; slug: string }
  | { name: "connection" }
  | { name: "logs" }
  | { name: "discord-ipc" }

type NavValue = {
  tab: Tab
  route: Route | null
  stack: Route[]
  libraryQuery: string
  setTab: (tab: Tab) => void
  push: (route: Route) => void
  pop: () => void
  setLibraryQuery: (query: string) => void
}

const NavContext = createContext<NavValue | null>(null)

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [tab, setTabState] = useState<Tab>("activity")
  const [stack, setStack] = useState<Route[]>([])
  const [libraryQuery, setLibraryQuery] = useState("")

  const setTab = useCallback((next: Tab) => {
    setTabState(next)
    setStack([])
    persistAppView(next)
  }, [])

  const push = useCallback((route: Route) => setStack((current) => [...current, route]), [])
  const pop = useCallback(() => setStack((current) => current.slice(0, -1)), [])

  useEffect(() => {
    const applyPending = async () => {
      const pending = await loadPendingSidepanelNav()
      if (!pending || Date.now() - pending.at > 60_000) return
      await clearPendingSidepanelNav()
      setTabState(pending.view)
      if (pending.query !== undefined) setLibraryQuery(pending.query)
      setStack(pending.slug ? [{ name: "presence", slug: pending.slug }] : [])
    }
    void loadPersistedAppView().then(setTabState).then(applyPending)
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === "local" && SIDEPANEL_NAV_KEY in changes && changes[SIDEPANEL_NAV_KEY].newValue) void applyPending()
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  const value = useMemo(
    () => ({ tab, route: stack.at(-1) ?? null, stack, libraryQuery, setTab, push, pop, setLibraryQuery }),
    [tab, stack, libraryQuery, setTab, push, pop],
  )
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export const useNav = (): NavValue => {
  const value = useContext(NavContext)
  if (!value) throw new Error("useNav must be used inside <NavigationProvider>")
  return value
}

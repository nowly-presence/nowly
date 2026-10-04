import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  FEATURE_REVEALS_KEY,
  isFeatureRevealsState,
  isRevealDue,
  loadFeatureReveals,
  markFeatureRevealSeen,
  resetFeatureReveals,
  type FeatureRevealsState,
} from "@/shared/feature-reveal"

type RegisteredReveal = { id: string; version: string }

type FeatureRevealValue = {
  activeId: string | null
  register: (reveal: RegisteredReveal) => () => void
  complete: (id: string) => void
  replay: () => void
}

const SETTLE_DELAY_MS = 900

const FeatureRevealContext = createContext<FeatureRevealValue | null>(null)

const currentVersion = (): string => chrome.runtime.getManifest().version

export const FeatureRevealProvider = ({ enabled, children }: { enabled: boolean; children: ReactNode }) => {
  const [seen, setSeen] = useState<FeatureRevealsState | null>(null)
  const [registered, setRegistered] = useState<RegisteredReveal[]>([])
  const [settled, setSettled] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [replaying, setReplaying] = useState(false)

  useEffect(() => {
    void loadFeatureReveals().then(setSeen)
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !(FEATURE_REVEALS_KEY in changes)) return
      const next = changes[FEATURE_REVEALS_KEY].newValue
      setSeen(isFeatureRevealsState(next) ? next : {})
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  useEffect(() => {
    if (!enabled) return setSettled(false)
    const timer = window.setTimeout(() => setSettled(true), SETTLE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [enabled])

  const due = useMemo(() => {
    if (!seen) return null
    const version = currentVersion()
    return registered.find((reveal) => (replaying ? !(reveal.id in seen) : isRevealDue(reveal.id, reveal.version, version, seen)))?.id ?? null
  }, [registered, seen, replaying])

  useEffect(() => {
    setActiveId((current) => current ?? (settled ? due : null))
  }, [due, settled])

  const register = useCallback((reveal: RegisteredReveal) => {
    setRegistered((current) => (current.some((entry) => entry.id === reveal.id) ? current : [...current, reveal]))
    return () => setRegistered((current) => current.filter((entry) => entry.id !== reveal.id))
  }, [])

  const complete = useCallback((id: string) => {
    setActiveId((current) => (current === id ? null : current))
    setSeen((current) => ({ ...(current ?? {}), [id]: Date.now() }))
    void markFeatureRevealSeen(id)
  }, [])

  const replay = useCallback(() => {
    setActiveId(null)
    setReplaying(true)
    void resetFeatureReveals().then(() => setSeen({}))
  }, [])

  const value = useMemo(() => ({ activeId, register, complete, replay }), [activeId, register, complete, replay])
  return <FeatureRevealContext.Provider value={value}>{children}</FeatureRevealContext.Provider>
}

export const useFeatureReveals = (): FeatureRevealValue => {
  const value = useContext(FeatureRevealContext)
  if (!value) throw new Error("useFeatureReveals must be used inside <FeatureRevealProvider>")
  return value
}

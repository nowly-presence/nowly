import { getAnalyticsMetric } from "./catalog"

export type FunnelStep = {
  event?: string
  events?: string[]
  label?: string
}

export type FunnelDefinition = {
  id: string
  label: string
  steps: FunnelStep[]
}

export type FunnelEventRow = {
  key: string
  deviceId: string
  createdAt: Date
}

export type FunnelStepResult = {
  keys: string[]
  label: string
  uniqueDevices: number
  conversionFromPrevious: number | null
  conversionFromStart: number | null
  dropOff: number | null
}

export type FunnelMeasurement = {
  id: string
  label: string
  steps: FunnelStepResult[]
  overallConversion: number | null
}

const funnels: FunnelDefinition[] = []

export const stepKeys = (step: FunnelStep): string[] => {
  if (step.events?.length) return step.events
  if (step.event) return [step.event]
  return []
}

export const defineFunnel = (definition: FunnelDefinition): FunnelDefinition => {
  for (const step of definition.steps) {
    for (const key of stepKeys(step)) {
      if (!getAnalyticsMetric(key)) {
        throw new Error(`Funnel "${definition.id}" references unknown event "${key}"`)
      }
    }
  }
  const existing = funnels.findIndex((funnel) => funnel.id === definition.id)
  if (existing >= 0) funnels.splice(existing, 1)
  funnels.push(definition)
  return definition
}

export const listFunnels = (): FunnelDefinition[] => [...funnels]

export const getFunnel = (id: string): FunnelDefinition | undefined =>
  funnels.find((funnel) => funnel.id === id)

const percent = (numerator: number, denominator: number): number | null => {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 10_000) / 100
}

export const measureFunnel = (definition: FunnelDefinition, rows: FunnelEventRow[]): FunnelMeasurement => {
  const byDevice = new Map<string, FunnelEventRow[]>()
  for (const row of rows) {
    if (!row.deviceId) continue
    const list = byDevice.get(row.deviceId)
    if (list) list.push(row)
    else byDevice.set(row.deviceId, [row])
  }

  for (const list of byDevice.values()) {
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  const reached = definition.steps.map(() => 0)

  for (const events of byDevice.values()) {
    let cursor = 0
    for (let index = 0; index < definition.steps.length; index += 1) {
      const keys = new Set(stepKeys(definition.steps[index]))
      const match = events.find((event) => event.createdAt.getTime() >= cursor && keys.has(event.key))
      if (!match) break
      reached[index] += 1
      cursor = match.createdAt.getTime()
    }
  }

  const start = reached[0] ?? 0
  const steps = definition.steps.map((step, index) => {
    const keys = stepKeys(step)
    const uniqueDevices = reached[index] ?? 0
    const previous = index === 0 ? uniqueDevices : reached[index - 1] ?? 0
    return {
      keys,
      label: step.label ?? keys.join(" | "),
      uniqueDevices,
      conversionFromPrevious: index === 0 ? 100 : percent(uniqueDevices, previous),
      conversionFromStart: percent(uniqueDevices, start),
      dropOff: index === 0 ? null : percent(Math.max(0, previous - uniqueDevices), previous),
    }
  })

  const last = reached[reached.length - 1] ?? 0

  return {
    id: definition.id,
    label: definition.label,
    steps,
    overallConversion: percent(last, start),
  }
}

defineFunnel({
  id: "acquisition-marketplace",
  label: "Acquisition marketplace",
  steps: [
    { event: "marketplace_page_view" },
    { event: "marketplace_install_click" },
    { event: "marketplace_conversion" },
  ],
})

defineFunnel({
  id: "activation",
  label: "Activation",
  steps: [
    { event: "extension_install" },
    { event: "onboarding_completed" },
    { event: "presence_install" },
    { event: "presence_session_start" },
  ],
})

defineFunnel({
  id: "native",
  label: "Native",
  steps: [
    { event: "native_connected" },
    { event: "presence_session_start" },
  ],
})

defineFunnel({
  id: "uninstall",
  label: "Uninstall",
  steps: [
    { event: "uninstall_cleanup_received" },
    { events: ["uninstall_analytics_deleted", "uninstall_analytics_kept"], label: "Choice recorded" },
  ],
})

import { describe, expect, it } from "vitest"
import { analyticsRegistry, getAnalyticsMetric } from "../src/catalog"
import { createAnalyticsClient } from "../src/client"
import { alwaysGrantedConsent } from "../src/consent"
import { getFunnel, listFunnels, measureFunnel } from "../src/funnels"
import { anonymousIdentity } from "../src/identity"
import { legacySources } from "../src/legacy-sources"
import { FORBIDDEN_PAYLOAD_KEYS_SET } from "../src/policies"
import { autoGranularity, resolveRange } from "../src/ranges"
import { sanitizePayload } from "../src/sanitize"

describe("@nowly/analytics", () => {
  it("keeps every catalog key represented in the legacy inventory", () => {
    const inventoried = new Set(legacySources.map((source) => source.key))
    for (const metric of analyticsRegistry) {
      expect(inventoried.has(metric.key)).toBe(true)
    }
  })

  it("defines the initial funnels on migrated keys", () => {
    expect(listFunnels().map((funnel) => funnel.id)).toEqual([
      "acquisition-marketplace",
      "activation",
      "native",
      "uninstall",
    ])
    expect(getFunnel("activation")?.steps.map((step) => step.event)).toEqual([
      "extension_install",
      "onboarding_completed",
      "presence_install",
      "presence_session_start",
    ])
  })

  it("measures unique devices in temporal order", () => {
    const funnel = getFunnel("native")
    expect(funnel).toBeDefined()
    const result = measureFunnel(funnel!, [
      { key: "native_connected", deviceId: "a", createdAt: new Date("2026-01-01T00:00:00Z") },
      { key: "presence_session_start", deviceId: "a", createdAt: new Date("2026-01-01T00:01:00Z") },
      { key: "presence_session_start", deviceId: "b", createdAt: new Date("2026-01-01T00:00:00Z") },
      { key: "native_connected", deviceId: "b", createdAt: new Date("2026-01-01T00:02:00Z") },
    ])
    expect(result.steps[0]?.uniqueDevices).toBe(2)
    expect(result.steps[1]?.uniqueDevices).toBe(1)
    expect(result.overallConversion).toBe(50)
  })

  it("uses auto granularity by range", () => {
    expect(autoGranularity("1h")).toBe("second")
    expect(autoGranularity("24h")).toBe("minute")
    expect(autoGranularity("7d")).toBe("hour")
    expect(autoGranularity("30d")).toBe("day")
    expect(resolveRange("nope").id).toBe("7d")
  })

  it("strips forbidden payload keys", () => {
    const payload = sanitizePayload("presence_error", {
      stage: "security",
      url: "https://example.com",
      title: "secret",
    })
    expect(payload).toEqual({ stage: "security" })
    expect(FORBIDDEN_PAYLOAD_KEYS_SET.has("url")).toBe(true)
    expect(getAnalyticsMetric("presence_error")?.private).toBe(true)
  })

  it("queues typed events through the client", async () => {
    const sent: unknown[] = []
    const client = createAnalyticsClient({
      transport: { send: async (events) => { sent.push(...events) } },
      consent: alwaysGrantedConsent,
      identity: anonymousIdentity,
      flushAt: 1,
    })
    await client.track("marketplace_page_view", { payload: { source: "library", locale: "en-US" } })
    expect(sent).toHaveLength(1)
    expect((sent[0] as { key: string }).key).toBe("marketplace_page_view")
  })
})

import { isAnalyticsEventKey } from "./catalog"
import type { ConsentProvider } from "./consent"
import { isConsentGranted } from "./consent"
import type { IdentityProvider } from "./identity"
import { MAX_ANALYTICS_EVENTS_PER_BATCH } from "./policies"
import { AnalyticsQueue } from "./queue"
import { sanitizeDeviceId, sanitizePayload, sanitizeSlug, sanitizeSource, sanitizeVersion } from "./sanitize"
import type { AnalyticsTransport, OutboundAnalyticsEvent } from "./transport"

export type TrackInput = {
  slug?: string
  version?: string
  source?: string
  payload?: Record<string, unknown>
  deviceId?: string
  eventId?: string
  createdAt?: Date | string
}

export type AnalyticsClientOptions = {
  transport: AnalyticsTransport
  consent: ConsentProvider
  identity: IdentityProvider
  flushAt?: number
}

const createEventId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export const createAnalyticsClient = (options: AnalyticsClientOptions) => {
  const queue = new AnalyticsQueue()
  const flushAt = options.flushAt ?? 10
  let flushing = false

  const flush = async (): Promise<void> => {
    if (flushing || queue.size === 0) return
    const consent = await options.consent.get()
    if (!isConsentGranted(consent)) {
      queue.drain(queue.size)
      return
    }
    flushing = true
    const batch = queue.drain(MAX_ANALYTICS_EVENTS_PER_BATCH)
    try {
      await options.transport.send(batch)
    } catch {
      queue.restore(batch)
    } finally {
      flushing = false
    }
  }

  const track = async (key: string, input: TrackInput = {}): Promise<void> => {
    if (!isAnalyticsEventKey(key)) return
    const consent = await options.consent.get()
    if (!isConsentGranted(consent)) return

    const identityDeviceId = await options.identity.getDeviceId()
    const createdAt = input.createdAt instanceof Date
      ? input.createdAt.toISOString()
      : typeof input.createdAt === "string"
        ? input.createdAt
        : new Date().toISOString()

    const event: OutboundAnalyticsEvent = {
      eventId: input.eventId?.trim() || createEventId(),
      key,
      deviceId: sanitizeDeviceId(input.deviceId ?? identityDeviceId),
      slug: sanitizeSlug(input.slug),
      version: sanitizeVersion(input.version),
      source: sanitizeSource(input.source),
      payload: sanitizePayload(key, input.payload),
      createdAt,
    }

    queue.enqueue(event)
    if (queue.size >= flushAt) await flush()
  }

  return { track, flush, queue }
}

export type AnalyticsClient = ReturnType<typeof createAnalyticsClient>

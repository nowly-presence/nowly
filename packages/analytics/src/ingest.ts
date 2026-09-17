import { z } from "zod"
import { ANALYTICS_SOURCES, MAX_ANALYTICS_EVENTS_PER_BATCH } from "./policies"

export const ingestEventSchema = z.object({
  eventId: z.string().trim().min(1).max(120).optional(),
  key: z.string().trim().min(1).max(100),
  deviceId: z.string().trim().max(120).optional(),
  slug: z.string().trim().max(80).optional(),
  version: z.string().trim().max(60).optional(),
  // Country is never accepted from the client - it's derived server-side
  // from the request (CF-IPCountry) at ingestion time, never trusted as input.
  source: z.enum(ANALYTICS_SOURCES).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().trim().optional(),
})

export const ingestEventsBodySchema = z.object({
  events: z.array(ingestEventSchema).max(MAX_ANALYTICS_EVENTS_PER_BATCH).default([]),
})

export type IngestEvent = z.infer<typeof ingestEventSchema>
export type IngestEventsBody = z.infer<typeof ingestEventsBodySchema>

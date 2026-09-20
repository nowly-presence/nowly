import type { PresencePayload } from "@/shared/types/native"

export type PresenceData = {
  name?: string
  appName?: string
  details?: string
  state?: string
  startTimestamp?: number
  endTimestamp?: number
  largeImageKey?: string
  largeImageText?: string
  smallImageKey?: string
  smallImageText?: string
  type?: number
  buttons?: { label: string; url: string }[]
}

export type PresenceMetadata = {
  slug: string
  name: string
  author: { name: string; github?: string }
  contributors?: { name: string; github?: string }[]
  description: Record<string, string>
  longDescription?: Record<string, string>
  url: string[]
  regExp?: string
  color: string
  category: "streaming" | "music" | "video" | "social" | "gaming" | "tools" | "ai" | "learning" | "creator" | "other"
  tags?: string[]
  features?: Record<string, string[]>
  version?: string | null
  settings?: Record<string, unknown>
  locales?: Record<string, Record<string, string>>
  world?: "main" | "isolated"
  runAt?: "document_start" | "document_end" | "document_idle"
  discordNative?: boolean
  imageProxy?: { hostSuffixes: string[]; headers?: Record<string, string> }
}

export type PresenceRelease = {
  slug: string
  version: string
  metadata: PresenceMetadata
  bundle: string
  sha256: string
  metadataHash: string
  signature: string
  signedAt: string
  // Present on API responses (GET /presences/:slug), absent on locally built
  // (zip/bundled) releases that never round-tripped through the API.
  totalInstalls?: number
  activeUsers?: number
  addedAt?: string | null
  lastUpdated?: string | null
}

export type PresenceSchedule = { start?: string; end?: string; days: number[] }

export type StoredPresence = {
  metadata: PresenceMetadata
  release: PresenceRelease
  enabled: boolean
  installedAt: number
  updatedAt?: number
  snoozeUntil?: number
  schedule?: PresenceSchedule
  source?: "store" | "bundle" | "local"
}

export type InstalledPresences = Record<string, StoredPresence>

export type CurrentActivity = {
  slug: string
  presence: PresencePayload
  updatedAt: number
}

export type PresenceDebug = {
  stage: string
  message: string
  url?: string
  updatedAt: number
}

export type PresenceSettings = Record<string, unknown>

export type PresenceCatalogItem = {
  slug: string
  name?: string | Record<string, string>
  description?: string | Record<string, string>
  longDescription?: string | Record<string, string>
  category?: PresenceMetadata["category"]
  color?: string
  author?: { name: string; github?: string }
  contributors?: { name: string; github?: string }[]
  version?: string | null
  url?: string[]
  features?: Record<string, string[]>
  settings?: Record<string, unknown>
  locales?: Record<string, Record<string, string>>
  totalInstalls?: number
  activeUsers?: number
  addedAt?: string | null
  lastUpdated?: string | null
  discordNative?: boolean
}

export const SYNC_DOCUMENT_KEYS = ["settings", "presences", "presenceSettings", "featureReveals", "customActivities"] as const

export type SyncDocumentKey = (typeof SYNC_DOCUMENT_KEYS)[number]

export const SYNC_DOCUMENT_MAX_BYTES: Record<SyncDocumentKey, number> = {
  settings: 32 * 1024,
  presences: 64 * 1024,
  presenceSettings: 128 * 1024,
  featureReveals: 4 * 1024,
  customActivities: 256 * 1024,
}

export const isSyncDocumentKey = (value: string): value is SyncDocumentKey =>
  (SYNC_DOCUMENT_KEYS as readonly string[]).includes(value)

export const EXTENSION_TOKEN_SCOPES = ["sync", "assets", "creator"] as const

export type ExtensionTokenScope = (typeof EXTENSION_TOKEN_SCOPES)[number]

export const EXTENSION_TOKEN_PREFIX = "nxt_"

export const EXTENSION_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000

export const jsonByteLength = (value: unknown): number => new TextEncoder().encode(JSON.stringify(value) ?? "").length

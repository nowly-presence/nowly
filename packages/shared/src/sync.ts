export const SYNC_DOCUMENT_MAX_BYTES = {
  settings: 32 * 1024,
  presences: 64 * 1024,
  presenceSettings: 128 * 1024,
  featureReveals: 4 * 1024,
  customActivities: 256 * 1024
} as const satisfies Record<string, number>;

export type SyncDocumentKey = keyof typeof SYNC_DOCUMENT_MAX_BYTES;

export const SYNC_DOCUMENT_KEYS = Object.keys(SYNC_DOCUMENT_MAX_BYTES) as SyncDocumentKey[];

export const isSyncDocumentKey = (value: string): value is SyncDocumentKey => Object.hasOwn(SYNC_DOCUMENT_MAX_BYTES, value);

export const EXTENSION_TOKEN_SCOPES = ["sync", "assets", "creator", "admin"] as const;

export type ExtensionTokenScope = (typeof EXTENSION_TOKEN_SCOPES)[number];

export const EXTENSION_TOKEN_PREFIX = "nxt_";

export const EXTENSION_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export const jsonByteLength = (value: unknown): number => new TextEncoder().encode(JSON.stringify(value) ?? "").length;
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BROWSER: "chrome" | "firefox"
  readonly VITE_NOWLY_CHANNEL: "stable" | "canary"
  readonly VITE_WEB_BASE_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_CDN_BASE_URL?: string
  readonly VITE_PREVIEW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "@/generated/bundled-presences" {
  import type { PresenceRelease } from "@/shared/types"

  export interface BundledPresence {
    slug: string
    release: PresenceRelease
  }

  export const BUNDLED_PRESENCES: BundledPresence[]
}

declare module "@/generated/bundled-presence-slugs" {
  export const BUNDLED_PRESENCE_SLUGS: string[]
}

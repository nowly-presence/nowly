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

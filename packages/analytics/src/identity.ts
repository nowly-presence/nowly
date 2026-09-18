export type IdentityProvider = {
  getDeviceId: () => string | undefined | Promise<string | undefined>
}

export const anonymousIdentity: IdentityProvider = {
  getDeviceId: () => undefined,
}

export const staticIdentity = (deviceId: string): IdentityProvider => ({
  getDeviceId: () => deviceId,
})

const BROWSER_DEVICE_KEY = "nowly:analytics:v1:deviceId"

export const createBrowserIdentity = (storageKey = BROWSER_DEVICE_KEY): IdentityProvider => ({
  getDeviceId: () => {
    if (typeof window === "undefined") return undefined
    try {
      const existing = window.localStorage.getItem(storageKey)
      if (existing) return existing
      const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
      window.localStorage.setItem(storageKey, id)
      return id
    } catch {
      return undefined
    }
  },
})

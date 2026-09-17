export type ConsentState = "granted" | "denied" | "unknown"

export type ConsentProvider = {
  get: () => ConsentState | Promise<ConsentState>
}

export const alwaysGrantedConsent: ConsentProvider = {
  get: () => "granted",
}

export const alwaysDeniedConsent: ConsentProvider = {
  get: () => "denied",
}

export const isConsentGranted = (state: ConsentState): boolean => state === "granted"

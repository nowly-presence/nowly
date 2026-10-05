export type PreviewAccount = "out" | "in" | "choice" | "error"

const ACCOUNTS: readonly PreviewAccount[] = ["out", "in", "choice", "error"]

export type PreviewScenario = "live" | "idle" | "nohost" | "nodiscord" | "paused" | "empty"

const SCENARIOS: readonly PreviewScenario[] = ["live", "idle", "nohost", "nodiscord", "paused", "empty"]

export type PreviewNative = "ok" | "ipc-denied"

const NATIVE_STATES: readonly PreviewNative[] = ["ok", "ipc-denied"]

const params = new URLSearchParams(location.search)

const scenarioParam = params.get("scenario")
const accountParam = params.get("account")
const nativeParam = params.get("native")
const seasonParam = params.get("season")
const prank = params.get("prank") === "1"
const support = params.get("support") === "1"

export const previewParams = {
  scenario: SCENARIOS.find((value) => value === scenarioParam) ?? (support ? "idle" : "live"),
  lang: params.get("lang"),
  theme: params.get("theme") ?? "light",
  view: params.get("view") ?? "activity",
  slug: params.get("slug"),
  host: params.get("host"),
  onboarding: params.get("onboarding") === "1",
  scriptsDenied: params.get("scripts") === "0",
  developer: params.get("dev") === "1",
  review: params.get("review") === "1",
  season: seasonParam ?? (prank ? "halloween" : null),
  prank,
  reveal: params.get("reveal") === "1",
  support,
  account: ACCOUNTS.find((value) => value === accountParam) ?? "out",
  native: NATIVE_STATES.find((value) => value === nativeParam) ?? "ok",
}

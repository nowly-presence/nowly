export type PreviewScenario = "live" | "idle" | "nohost" | "nodiscord" | "paused" | "empty"

const SCENARIOS: readonly PreviewScenario[] = ["live", "idle", "nohost", "nodiscord", "paused", "empty"]

const params = new URLSearchParams(location.search)

const scenarioParam = params.get("scenario")

export const previewParams = {
  scenario: SCENARIOS.find((value) => value === scenarioParam) ?? "live",
  lang: params.get("lang"),
  theme: params.get("theme") ?? "light",
  view: params.get("view") ?? "activity",
  slug: params.get("slug"),
  host: params.get("host"),
  onboarding: params.get("onboarding") === "1",
  scriptsDenied: params.get("scripts") === "0",
  developer: params.get("dev") === "1",
  review: params.get("review") === "1",
}

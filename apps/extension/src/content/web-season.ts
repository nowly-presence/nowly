import { EXT_WEB_SOURCE } from "@/shared/constants"
import { isSeasonOverride, resolveSeason, SEASON_OVERRIDE_KEY, type Season } from "@/shared/seasonal-themes"

export const SETTINGS_STORAGE_KEY = "settings"
export const SEASON_MESSAGE = "SEASON"
export const SEASON_REQUEST = "GET_SEASON"

const LEGACY_SEASONAL_APPEARANCE = "seasonal"

type StorageChanges = Record<string, unknown>

type SeasonStorage = {
  get: (keys: string[]) => Promise<Record<string, unknown>>
  onChanged: { addListener: (listener: (changes: StorageChanges, area: string) => void) => void }
}

type SeasonWindow = {
  location: { origin: string }
  postMessage: (message: unknown, targetOrigin: string) => void
  addEventListener: (type: "message", listener: (event: { origin: string; source: unknown; data: unknown }) => void) => void
}

type WebSeasonOptions = {
  target: SeasonWindow
  storage: SeasonStorage
  isAllowedOrigin: (origin: string) => boolean
  now?: () => Date
}

export const seasonalThemesEnabled = (stored: unknown): boolean => {
  if (!stored || typeof stored !== "object") return true
  const settings = stored as Record<string, unknown>
  if (settings.appearance === LEGACY_SEASONAL_APPEARANCE) return true
  if (typeof settings.seasonalThemes === "boolean") return settings.seasonalThemes
  return settings.seasonalThemeMigrated !== true
}

export const readWebSeason = async (storage: SeasonStorage, date: Date): Promise<Season | null> => {
  const result = await storage.get([SETTINGS_STORAGE_KEY, SEASON_OVERRIDE_KEY])
  const override: unknown = result[SEASON_OVERRIDE_KEY]
  return resolveSeason({ enabled: seasonalThemesEnabled(result[SETTINGS_STORAGE_KEY]), date, override: isSeasonOverride(override) ? override : null })
}

const isSeasonRequest = (data: unknown): boolean => {
  if (!data || typeof data !== "object") return false
  const message = data as { source?: unknown; type?: unknown }
  return message.source === EXT_WEB_SOURCE && message.type === SEASON_REQUEST
}

export const startWebSeason = ({ target, storage, isAllowedOrigin, now = () => new Date() }: WebSeasonOptions): void => {
  let lastSent: Season | null | undefined

  const send = async (force: boolean): Promise<void> => {
    const origin = target.location.origin
    if (!isAllowedOrigin(origin)) return
    const season = await readWebSeason(storage, now())
    if (!force && season === lastSent) return
    lastSent = season
    target.postMessage({ source: EXT_WEB_SOURCE, type: SEASON_MESSAGE, payload: { season } }, origin)
  }

  target.addEventListener("message", (event) => {
    if (event.source !== target || !isAllowedOrigin(event.origin) || !isSeasonRequest(event.data)) return
    void send(true)
  })

  storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !(SETTINGS_STORAGE_KEY in changes || SEASON_OVERRIDE_KEY in changes)) return
    void send(false)
  })

  void send(true)
}

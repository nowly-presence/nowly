import type { Handler } from "@/background/router/router"
import { getSettings, setSettings } from "@/background/storage/settings.store"

export const handleGetSettings: Handler<"GET_SETTINGS"> = () => getSettings()

export const handleSetSettings: Handler<"SET_SETTINGS"> = (partial) => setSettings(partial)

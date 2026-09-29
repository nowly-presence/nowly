import type { InstalledPresences } from "@/shared/types"

export type UserScriptSource = {
  code?: string
  file?: string
}

export type RegisteredUserScript = {
  id: string
  matches: string[]
  js: UserScriptSource[]
  runAt?: "document_start" | "document_end" | "document_idle"
  allFrames?: boolean
  world?: "USER_SCRIPT" | "MAIN"
}

export type ChromeWithUserScripts = typeof chrome & {
  userScripts?: {
    getScripts(filter?: { ids?: string[] }): Promise<RegisteredUserScript[]>
    register(scripts: RegisteredUserScript[]): Promise<void>
    unregister(filter?: { ids?: string[] }): Promise<void>
  }
}

export const userScriptId = (slug: string): string => `nowly-presence-${slug}`

export const visiblePresences = (presences: InstalledPresences): InstalledPresences =>
  Object.fromEntries(
    Object.entries(presences).filter(
      ([, presence]) => presence?.metadata?.slug && presence.metadata.name && Array.isArray(presence.metadata.url),
    ),
  ) as InstalledPresences

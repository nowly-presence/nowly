import type { ExtensionTokenScope } from "@nowly/shared"
import type { PresenceSchedule } from "@/shared/types/presence"

export type AccountUser = {
  id: string
  name: string
  image: string | null
  discordId: string | null
}

export type StoredAccount = {
  token: string
  user: AccountUser
  scopes: ExtensionTokenScope[]
  expiresAt: number
  connectedAt: number
}

export type SyncErrorCode = "NETWORK" | "SERVER"

export type SyncChoice = "account" | "device"

export type AccountSnapshot =
  | { signedIn: false }
  | {
      signedIn: true
      user: AccountUser
      lastSyncedAt: number | null
      error: SyncErrorCode | null
      pendingChoice: boolean
    }

export type SyncPresenceEntry = {
  slug: string
  enabled: boolean
  schedule?: PresenceSchedule
  installedAt: number
}

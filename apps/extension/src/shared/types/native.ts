export type DiscordProfileSnapshot = {
  id: string
  username: string
  globalName?: string
  avatar?: string
}

export const NATIVE_ERROR_CODES = {
  discordIpcAccessDenied: "DISCORD_IPC_ACCESS_DENIED",
} as const

export type NativeErrorCode = (typeof NATIVE_ERROR_CODES)[keyof typeof NATIVE_ERROR_CODES]


export type PresencePayload = {
  name?: string
  details?: string
  state?: string
  startTime?: number
  endTime?: number
  largeImage?: string
  largeText?: string
  smallImage?: string
  smallText?: string
  type?: number
  buttons?: { label: string; url: string }[]
}

export type NativeMessage = { type: "PING" } | { type: "SET_ACTIVITY"; presence: PresencePayload } | { type: "CLEAR_ACTIVITY" }

export type NativeResponse =
  | {
      type: "PONG"
      connected: boolean
      status: string
      version?: string
      discordConnected?: boolean
      code?: NativeErrorCode
      profile?: DiscordProfileSnapshot | null
    }
  | { type: "CONNECTED"; version?: string }
  | { type: "OK" }
  | { type: "ERROR"; error: string; code?: NativeErrorCode }

export const isNativeErrorCode = (message: NativeResponse, code: NativeErrorCode): boolean =>
  "code" in message && message.code === code

export type NativeStatus = {
  connected: boolean
  status: string
  version?: string
  discordConnected?: boolean
  code?: NativeErrorCode
  codePrompted?: boolean
}

export type UserScriptsStatus = {
  enabled: boolean
  reason?: string
  requiresUserToggle?: boolean
}

import type { TrackInput } from "@nowly/analytics"
import type {
  AccountSnapshot,
  CurrentActivity,
  ExtensionSettings,
  InstalledPresences,
  NativeStatus,
  PresenceCatalogItem,
  PresenceData,
  PresenceDebug,
  PresenceSchedule,
  RuntimeLogEntry,
  StoredPresence,
  SyncChoice,
  TabState,
  UserScriptsStatus,
} from "@/shared/types"
import type { OnboardingState } from "@/background/storage/onboarding.store"

export type DiagnosticSnapshot = {
  extensionInstalled: boolean
  userScriptsActive: boolean
  hostDetected: boolean
  discordConnected: boolean
  presenceInstalled: boolean
  activityDetected: boolean
}

export type InstallResult = { ok: boolean; error?: string }
export type InstallFromApiResult = { ok: boolean; error?: string; queued?: boolean; status?: number }
export type InstallLocalZipResult = { ok: boolean; error?: string; slug?: string }
export type InstallLocalZipPayload = { fileName: string; bytes: string }
export type CatalogResponse = { ok: true; items: PresenceCatalogItem[] } | { ok: false; error: string }
export type PresenceEngagement = { liked: boolean; likeCount: number; totalInstalls: number; activeUsers: number }

export type RouterSource = "PRESENCES_POPUP" | "PRESENCES_CONTENT"

export type RouterMessageMap = {
  GET_PRESENCES: { payload: void; response: InstalledPresences }
  GET_NATIVE_STATUS: { payload: void; response: NativeStatus }
  GET_USER_SCRIPTS_STATUS: { payload: void; response: UserScriptsStatus }
  GET_DIAGNOSTIC: { payload: void; response: DiagnosticSnapshot }
  CONNECT_NATIVE: { payload: void; response: NativeStatus }
  RESTART_NATIVE: { payload: void; response: NativeStatus }
  ACKNOWLEDGE_DISCORD_IPC_ISSUE: { payload: void; response: NativeStatus }
  GET_CURRENT_ACTIVITY: { payload: void; response: CurrentActivity | null }
  GET_DEBUG: { payload: void; response: PresenceDebug | null }
  TOGGLE_PRESENCE: { payload: { slug: string; enabled: boolean }; response: { ok: boolean; error?: string } }
  UNINSTALL_PRESENCE: { payload: { slug: string }; response: { ok: boolean } }
  BULK_TOGGLE_PRESENCE: { payload: { slugs: string[]; enabled: boolean }; response: { ok: boolean } }
  BULK_UNINSTALL_PRESENCE: { payload: { slugs: string[] }; response: { ok: boolean } }
  ACTIVITY_UPDATE: { payload: { slug: string; activity: PresenceData }; response: { ok: boolean } }
  CLEAR_ACTIVITY: { payload: void; response: { ok: boolean } }
  INSTALL_PRESENCE: { payload: unknown; response: InstallResult }
  UPDATE_PRESENCE: { payload: unknown; response: InstallResult }
  INSTALL_PRESENCE_FROM_API: { payload: { slug: string }; response: InstallFromApiResult }
  INSTALL_LOCAL_PRESENCE_ZIP: { payload: InstallLocalZipPayload; response: InstallLocalZipResult }
  FETCH_PRESENCE_CATALOG: { payload: void; response: CatalogResponse }
  GET_PRESENCE_ENGAGEMENT: { payload: { slug: string }; response: PresenceEngagement }
  SET_PRESENCE_LIKE: { payload: { slug: string; liked: boolean }; response: { ok: boolean; count: number } }
  SET_PRESENCE_PAUSE: { payload: { paused: boolean }; response: { ok: boolean; paused?: boolean } }
  GET_INSTALL_QUEUE: { payload: void; response: { items: { slug: string }[] } }
  RETRY_INSTALL_QUEUE: { payload: void; response: { slugs: string[] } }
  CHECK_UPDATES: { payload: void; response: Record<string, string> }
  GET_SETTINGS: { payload: void; response: ExtensionSettings }
  SET_SETTINGS: { payload: Partial<ExtensionSettings>; response: ExtensionSettings }
  GET_ANALYTICS_CONSENT: { payload: void; response: { granted: boolean } }
  SET_ANALYTICS_CONSENT: { payload: { granted: boolean }; response: { granted: boolean } }
  RESET_ONBOARDING_FOR_DEV: { payload: void; response: ExtensionSettings }
  GET_PRESENCE_SETTINGS: { payload: void; response: Record<string, Record<string, unknown>> }
  SET_PRESENCE_SETTINGS: { payload: { slug: string; partial: Record<string, unknown> }; response: Record<string, unknown> }
  SNOOZE_PRESENCE: { payload: { slug: string; duration: number }; response: StoredPresence | null }
  CLEAR_SNOOZE: { payload: { slug: string }; response: StoredPresence | null }
  SET_PRESENCE_SCHEDULE: { payload: { slug: string; schedule: PresenceSchedule | undefined }; response: StoredPresence | null }
  GET_RUNTIME_LOGS: { payload: void; response: RuntimeLogEntry[] }
  CLEAR_RUNTIME_LOGS: { payload: void; response: { ok: boolean } }
  TRACK_EVENT: { payload: { key: string } & TrackInput; response: { ok: boolean } }
  DEBUG: { payload: PresenceDebug; response: { ok: boolean } }
  GET_ONBOARDING: { payload: void; response: OnboardingState }
  SET_ONBOARDING: { payload: Partial<OnboardingState>; response: OnboardingState }
  GET_TAB_STATE: { payload: void; response: TabState }
  SET_TAB_MUTED: { payload: { tabId: number; muted: boolean }; response: TabState }
  REPORT_PRESENCE: { payload: { slug: string; message: string; locale?: string }; response: { ok: boolean; error?: string } }
  EXPORT_DEVICE_DATA: { payload: void; response: { ok: boolean; data?: unknown; error?: string } }
  DELETE_DEVICE_DATA: { payload: void; response: { ok: boolean; error?: string } }
  SYNC_PRESENCE_SCRIPTS: { payload: void; response: { ok: boolean } }
  GET_ACCOUNT: { payload: void; response: AccountSnapshot }
  START_ACCOUNT_CONNECT: { payload: void; response: { ok: boolean } }
  NOWLY_SESSION: { payload: unknown; response: { ok: boolean; error?: string } }
  SYNC_ACCOUNT: { payload: void; response: AccountSnapshot }
  RESOLVE_SYNC_CHOICE: { payload: { choice: SyncChoice }; response: AccountSnapshot }
  SIGN_OUT_ACCOUNT: { payload: void; response: AccountSnapshot }
  STOP_ACCOUNT_SYNC: { payload: void; response: { ok: boolean; error?: string } }
}

export type RouterMessageType = keyof RouterMessageMap
export type PayloadOf<K extends RouterMessageType> = RouterMessageMap[K]["payload"]
export type ResponseOf<K extends RouterMessageType> = RouterMessageMap[K]["response"]

export type RouterRequest<K extends RouterMessageType = RouterMessageType> = {
  source: RouterSource
  type: K
  payload: PayloadOf<K>
}

import { handleGetAccount, handleNowlySession, handleResolveSyncChoice, handleSignOutAccount, handleStartAccountConnect, handleStopAccountSync, handleSyncAccount } from "@/background/router/handlers/account.handlers";
import { handleClearActivityMessage, handleDebug, handleGetCurrentActivity, handleGetDebug, handleActivityUpdateMessage, handleSetPresencePause } from "@/background/router/handlers/activity.handlers";
import { handleGetAnalyticsConsent, handleSetAnalyticsConsent, handleRecordExtensionActive, handleGetRuntimeLogs, handleClearRuntimeLogs } from "@/background/router/handlers/privacy.handlers";
import { handleGetDiagnostic } from "@/background/router/handlers/diagnostics.handlers";
import { handleAcknowledgeDiscordIpcIssue, handleConnectNative, handleGetNativeStatus, handleGetUserScriptsStatus, handleRestartNative } from "@/background/router/handlers/native.handlers";
import { handleBulkToggle, handleBulkUninstall, handleCheckUpdates, handleClearSnooze, handleFetchCatalog, handleGetInstallQueue, handleGetPresenceEngagement, handleGetPresenceSettings, handleGetPresences, handleInstall, handleInstallFromApi, handleInstallLocalZip, handleRetryInstallQueue, handleSetPresenceLike, handleSetPresenceSettings, handleSetSchedule, handleSnooze, handleToggle, handleUninstall, handleUpdate } from "@/background/router/handlers/presences.handlers";
import { handleGetSettings, handleResetOnboardingForDev, handleSetSettings } from "@/background/router/handlers/settings.handlers";
import { handleDeleteDeviceData, handleExportDeviceData, handleGetOnboarding, handleGetTabState, handleReportPresence, handleSetOnboarding, handleSetTabMuted, handleSyncPresenceScripts } from "@/background/router/handlers/extra.handlers";
import { handleDeleteCustomActivity, handleGetCustomActivities, handleGetCustomActivityDetection, handleGetCustomImages, handleSaveCustomActivity, handleSetCustomActivityActive, handleUploadCustomImage } from "@/background/router/handlers/custom-activity.handlers";
import { handleRecordUsageDay, handleSnoozeSupportPrompt } from "@/background/router/handlers/support.handlers";
import type { HandlerRegistry } from "@/background/router/router";
import { handleGetAnnouncements, handleRefreshAnnouncements, handleMarkAnnouncement } from "@/background/router/handlers/announcements.handlers";
import { handleAcceptLegalDocuments, handleCheckLegalDocuments, handleGetLegalState } from "@/background/router/handlers/legal.handlers";
import { applyPublication, publicationStatus } from "@/background/services/activity-publications";
import { getOwnedPublication, publishActivity } from "@/background/services/activity-publication-publisher";
import { openAccountConnect } from "@/background/services/account-sync";

export const buildHandlerRegistry = (): HandlerRegistry => ({
  GET_ACTIVITY_PUBLICATION_STATUS: (payload) => publicationStatus(payload),
  GET_OWN_ACTIVITY_PUBLICATION: ({ id }) => getOwnedPublication(id),
  APPLY_ACTIVITY_PUBLICATION: (payload) => applyPublication(payload),
  PUBLISH_CUSTOM_ACTIVITY: ({ id, baseRevision, unpublish }) => publishActivity(id, baseRevision, unpublish),
  START_CREATOR_CONNECT: async () => {
    await openAccountConnect(true);
    return {
      ok: true
    };
  },
  GET_ANNOUNCEMENTS: handleGetAnnouncements,
  REFRESH_ANNOUNCEMENTS: handleRefreshAnnouncements,
  MARK_ANNOUNCEMENT: handleMarkAnnouncement,
  GET_LEGAL_STATE: handleGetLegalState,
  CHECK_LEGAL_DOCUMENTS: handleCheckLegalDocuments,
  ACCEPT_LEGAL_DOCUMENTS: handleAcceptLegalDocuments,
  GET_PRESENCES: handleGetPresences,
  GET_NATIVE_STATUS: handleGetNativeStatus,
  GET_USER_SCRIPTS_STATUS: handleGetUserScriptsStatus,
  GET_DIAGNOSTIC: handleGetDiagnostic,
  CONNECT_NATIVE: handleConnectNative,
  RESTART_NATIVE: handleRestartNative,
  ACKNOWLEDGE_DISCORD_IPC_ISSUE: handleAcknowledgeDiscordIpcIssue,
  GET_CURRENT_ACTIVITY: handleGetCurrentActivity,
  GET_DEBUG: handleGetDebug,
  TOGGLE_PRESENCE: handleToggle,
  UNINSTALL_PRESENCE: handleUninstall,
  BULK_TOGGLE_PRESENCE: handleBulkToggle,
  BULK_UNINSTALL_PRESENCE: handleBulkUninstall,
  ACTIVITY_UPDATE: handleActivityUpdateMessage,
  CLEAR_ACTIVITY: handleClearActivityMessage,
  INSTALL_PRESENCE: handleInstall,
  UPDATE_PRESENCE: handleUpdate,
  INSTALL_PRESENCE_FROM_API: handleInstallFromApi,
  INSTALL_LOCAL_PRESENCE_ZIP: handleInstallLocalZip,
  FETCH_PRESENCE_CATALOG: handleFetchCatalog,
  GET_PRESENCE_ENGAGEMENT: handleGetPresenceEngagement,
  SET_PRESENCE_LIKE: handleSetPresenceLike,
  SET_PRESENCE_PAUSE: handleSetPresencePause,
  GET_INSTALL_QUEUE: handleGetInstallQueue,
  RETRY_INSTALL_QUEUE: handleRetryInstallQueue,
  CHECK_UPDATES: handleCheckUpdates,
  GET_SETTINGS: handleGetSettings,
  SET_SETTINGS: handleSetSettings,
  GET_ANALYTICS_CONSENT: handleGetAnalyticsConsent,
  SET_ANALYTICS_CONSENT: handleSetAnalyticsConsent,
  RESET_ONBOARDING_FOR_DEV: handleResetOnboardingForDev,
  GET_PRESENCE_SETTINGS: handleGetPresenceSettings,
  SET_PRESENCE_SETTINGS: handleSetPresenceSettings,
  SNOOZE_PRESENCE: handleSnooze,
  CLEAR_SNOOZE: handleClearSnooze,
  SET_PRESENCE_SCHEDULE: handleSetSchedule,
  GET_RUNTIME_LOGS: handleGetRuntimeLogs,
  CLEAR_RUNTIME_LOGS: handleClearRuntimeLogs,
  RECORD_EXTENSION_ACTIVE: handleRecordExtensionActive,
  DEBUG: handleDebug,
  GET_ONBOARDING: handleGetOnboarding,
  SET_ONBOARDING: handleSetOnboarding,
  GET_TAB_STATE: handleGetTabState,
  SET_TAB_MUTED: handleSetTabMuted,
  REPORT_PRESENCE: handleReportPresence,
  EXPORT_DEVICE_DATA: handleExportDeviceData,
  DELETE_DEVICE_DATA: handleDeleteDeviceData,
  SYNC_PRESENCE_SCRIPTS: handleSyncPresenceScripts,
  GET_CUSTOM_ACTIVITIES: handleGetCustomActivities,
  GET_CUSTOM_ACTIVITY_DETECTION: handleGetCustomActivityDetection,
  SAVE_CUSTOM_ACTIVITY: handleSaveCustomActivity,
  DELETE_CUSTOM_ACTIVITY: handleDeleteCustomActivity,
  SET_CUSTOM_ACTIVITY_ACTIVE: handleSetCustomActivityActive,
  UPLOAD_CUSTOM_IMAGE: handleUploadCustomImage,
  GET_CUSTOM_IMAGES: handleGetCustomImages,
  GET_ACCOUNT: handleGetAccount,
  START_ACCOUNT_CONNECT: handleStartAccountConnect,
  NOWLY_SESSION: handleNowlySession,
  SYNC_ACCOUNT: handleSyncAccount,
  RESOLVE_SYNC_CHOICE: handleResolveSyncChoice,
  SIGN_OUT_ACCOUNT: handleSignOutAccount,
  STOP_ACCOUNT_SYNC: handleStopAccountSync,
  RECORD_USAGE_DAY: handleRecordUsageDay,
  SNOOZE_SUPPORT_PROMPT: handleSnoozeSupportPrompt
});
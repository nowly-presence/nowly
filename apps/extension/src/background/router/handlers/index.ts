import { handleNowlySession, handleResolveSyncChoice, handleSignOutAccount, handleStartAccountConnect, handleStopAccountSync, handleSyncAccount } from "@/background/router/handlers/account.handlers";
import { handleClearActivityMessage, handleDebug, handleActivityUpdateMessage, handleSetPresencePause } from "@/background/router/handlers/activity.handlers";
import { handleGetAnalyticsConsent, handleSetAnalyticsConsent, handleRecordExtensionActive, handleGetRuntimeLogs, handleClearRuntimeLogs } from "@/background/router/handlers/privacy.handlers";
import { handleCreatorExtract, handleCreatorFetchSubmissions, handleCreatorGetAccount, handleCreatorHighlight, handleCreatorPickCancel, handleCreatorPickStart, handleCreatorSubmit, handleCreatorSyncDrafts, handleCreatorTestActivity } from "@/background/router/handlers/creator.handlers";
import { handleGetDiagnostic } from "@/background/router/handlers/diagnostics.handlers";
import { handleGetUserScriptsStatus } from "@/background/router/handlers/native.handlers";
import { handleBulkToggle, handleBulkUninstall, handleClearSnooze, handleFetchCatalog, handleGetInstallQueue, handleGetPresenceEngagement, handleGetPresences, handleInstall, handleInstallFromApi, handleInstallLocalZip, handleSetPresenceLike, handleSetPresenceSettings, handleSetSchedule, handleSnooze, handleToggle, handleUninstall, handleUpdate } from "@/background/router/handlers/presences.handlers";
import { handleGetSettings, handleResetOnboardingForDev, handleSetSettings } from "@/background/router/handlers/settings.handlers";
import { handleAdminReportList, handleAdminReportSend, handleAdminReportThread, handleReportCreate, handleReportIdentity, handleReportList, handleReportReply, handleReportSetClosed, handleReportThread } from "@/background/router/handlers/reports.handlers";
import { handleDeleteDeviceData, handleExportDeviceData, handleGetOnboarding, handleGetTabState, handleReportPresence, handleSetOnboarding, handleSetTabMuted, handleSyncPresenceScripts } from "@/background/router/handlers/extra.handlers";
import { handleDeleteCustomActivity, handleGetCustomImages, handleSaveCustomActivity, handleSetCustomActivityActive, handleUploadCustomImage } from "@/background/router/handlers/custom-activity.handlers";
import { handleRecordUsageDay, handleSnoozeSupportPrompt } from "@/background/router/handlers/support.handlers";
import type { HandlerRegistry } from "@/background/router/router";
import { handleRefreshAnnouncements, handleMarkAnnouncement } from "@/background/router/handlers/announcements.handlers";
import { handleAcceptLegalDocuments, handleCheckLegalDocuments, handleGetLegalState } from "@/background/router/handlers/legal.handlers";
import { applyPublication, publicationStatus } from "@/background/services/activity-publications";
import { getOwnedPublication, publishActivity } from "@/background/services/activity-publication-publisher";
import { createAnnouncement, deletePresence, fetchHiddenPresences, fetchReviewQueue, fetchSubmissionDetail, getStaffAccess, loadCreatorPresenceDraft, probeCreatorPresence, publishSubmission, retryPullRequest, sendReview, setPresenceHidden } from "@/background/services/admin-api";
import { getCustomActivityDeletionPlan } from "@/background/services/custom-activity-deletion-plan";

import { getAccountSnapshot } from "@/background/services/account-sync";
import { getCurrentActivity, getDebug, getPresenceSettings } from "@/background/storage/presences.store";
import { getAnnouncementsSnapshot } from "@/background/services/announcements";
import { getCustomActivities } from "@/background/storage/custom-activities.store";
import { resolveCustomActivityDetection } from "@/background/services/custom-activity-detection";
import { acknowledgeDiscordIpcIssue, reconnectNative, refreshNativeStatus, restartNative } from "@/background/services/native";
import { checkUpdates, drainInstallQueue } from "@/background/managers/presence-manager";

export const buildHandlerRegistry = (): HandlerRegistry => ({
  GET_ACTIVITY_PUBLICATION_STATUS: (payload) => publicationStatus(payload),
  GET_OWN_ACTIVITY_PUBLICATION: ({ id }) => getOwnedPublication(id),
  GET_CUSTOM_ACTIVITY_DELETION_PLAN: ({ id }) => getCustomActivityDeletionPlan(id),
  APPLY_ACTIVITY_PUBLICATION: (payload) => applyPublication(payload),
  PUBLISH_CUSTOM_ACTIVITY: ({ id, baseRevision, unpublish }) => publishActivity(id, baseRevision, unpublish),
  ADMIN_GET_ACCESS: () => getStaffAccess(),
  ADMIN_FETCH_QUEUE: () => fetchReviewQueue(),
  ADMIN_FETCH_HIDDEN_PRESENCES: () => fetchHiddenPresences(),
  ADMIN_SET_PRESENCE_HIDDEN: ({ slug, hidden }) => setPresenceHidden(slug, hidden),
  ADMIN_DELETE_PRESENCE: ({ slug }) => deletePresence(slug),
  SUBMISSION_GET_DETAIL: ({ id }) => fetchSubmissionDetail(id),
  ADMIN_REVIEW: (payload) => sendReview(payload),
  ADMIN_PUBLISH: ({ id, revision }) => publishSubmission(id, revision),
  ADMIN_RETRY_PULL_REQUEST: ({ id }) => retryPullRequest(id),
  ADMIN_CREATE_ANNOUNCEMENT: ({ announcement }) => createAnnouncement(announcement),
  ADMIN_PROBE_CREATOR_PRESENCE: ({ slug }) => probeCreatorPresence(slug),
  ADMIN_LOAD_CREATOR_PRESENCE: ({ slug }) => loadCreatorPresenceDraft(slug),
  GET_ANNOUNCEMENTS: getAnnouncementsSnapshot,
  REFRESH_ANNOUNCEMENTS: handleRefreshAnnouncements,
  MARK_ANNOUNCEMENT: handleMarkAnnouncement,
  GET_LEGAL_STATE: handleGetLegalState,
  CHECK_LEGAL_DOCUMENTS: handleCheckLegalDocuments,
  ACCEPT_LEGAL_DOCUMENTS: handleAcceptLegalDocuments,
  GET_PRESENCES: handleGetPresences,
  GET_NATIVE_STATUS: refreshNativeStatus,
  GET_USER_SCRIPTS_STATUS: handleGetUserScriptsStatus,
  GET_DIAGNOSTIC: handleGetDiagnostic,
  CONNECT_NATIVE: reconnectNative,
  RESTART_NATIVE: restartNative,
  ACKNOWLEDGE_DISCORD_IPC_ISSUE: acknowledgeDiscordIpcIssue,
  GET_CURRENT_ACTIVITY: getCurrentActivity,
  GET_DEBUG: getDebug,
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
  RETRY_INSTALL_QUEUE: drainInstallQueue,
  CHECK_UPDATES: checkUpdates,
  GET_SETTINGS: handleGetSettings,
  SET_SETTINGS: handleSetSettings,
  GET_ANALYTICS_CONSENT: handleGetAnalyticsConsent,
  SET_ANALYTICS_CONSENT: handleSetAnalyticsConsent,
  RESET_ONBOARDING_FOR_DEV: handleResetOnboardingForDev,
  GET_PRESENCE_SETTINGS: getPresenceSettings,
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
  REPORT_CREATE: handleReportCreate,
  ADMIN_REPORT_LIST: handleAdminReportList,
  ADMIN_REPORT_THREAD: handleAdminReportThread,
  ADMIN_REPORT_SEND: handleAdminReportSend,
  REPORT_IDENTITY: handleReportIdentity,
  REPORT_LIST: handleReportList,
  REPORT_THREAD: handleReportThread,
  REPORT_REPLY: handleReportReply,
  REPORT_SET_CLOSED: handleReportSetClosed,
  EXPORT_DEVICE_DATA: handleExportDeviceData,
  CREATOR_PICK_START: handleCreatorPickStart,
  CREATOR_PICK_CANCEL: handleCreatorPickCancel,
  CREATOR_EXTRACT: handleCreatorExtract,
  CREATOR_HIGHLIGHT: handleCreatorHighlight,
  CREATOR_TEST_ACTIVITY: handleCreatorTestActivity,
  CREATOR_GET_ACCOUNT: handleCreatorGetAccount,
  CREATOR_SUBMIT: handleCreatorSubmit,
  CREATOR_FETCH_SUBMISSIONS: handleCreatorFetchSubmissions,
  CREATOR_SYNC_DRAFTS: handleCreatorSyncDrafts,
  DELETE_DEVICE_DATA: handleDeleteDeviceData,
  SYNC_PRESENCE_SCRIPTS: handleSyncPresenceScripts,
  GET_CUSTOM_ACTIVITIES: getCustomActivities,
  GET_CUSTOM_ACTIVITY_DETECTION: resolveCustomActivityDetection,
  SAVE_CUSTOM_ACTIVITY: handleSaveCustomActivity,
  DELETE_CUSTOM_ACTIVITY: handleDeleteCustomActivity,
  SET_CUSTOM_ACTIVITY_ACTIVE: handleSetCustomActivityActive,
  UPLOAD_CUSTOM_IMAGE: handleUploadCustomImage,
  GET_CUSTOM_IMAGES: handleGetCustomImages,
  GET_ACCOUNT: getAccountSnapshot,
  START_ACCOUNT_CONNECT: handleStartAccountConnect,
  NOWLY_SESSION: handleNowlySession,
  SYNC_ACCOUNT: handleSyncAccount,
  RESOLVE_SYNC_CHOICE: handleResolveSyncChoice,
  SIGN_OUT_ACCOUNT: handleSignOutAccount,
  STOP_ACCOUNT_SYNC: handleStopAccountSync,
  RECORD_USAGE_DAY: handleRecordUsageDay,
  SNOOZE_SUPPORT_PROMPT: handleSnoozeSupportPrompt
});
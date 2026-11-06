import type { AnnouncementsState } from "@/shared/announcements";
import type { PublicationReview, PublicationStatus, PublicationApply, PublicationResult } from "@nowly/shared";
import type { LegalConfirmation, LegalConfirmationResult, LegalState } from "@nowly/shared/legal";
import type { AccountSnapshot, CurrentActivity, CustomActivitiesState, CustomActivityDetection, CustomActivityDraft, ExtensionSettings, InstalledPresences, NativeStatus, PresenceCatalogItem, PresenceData, PresenceDebug, PresenceSchedule, RuntimeLogEntry, StoredPresence, SyncChoice, TabState, UserScriptsStatus } from "@/shared/types";
import type { OnboardingState } from "@/background/storage/onboarding.store";
import type { SaveCustomActivityResult, UploadCustomImageResult } from "@/background/managers/custom-activity-manager";
import type { SupportPromptAction, SupportPromptState } from "@/shared/support-prompt";
import type { PublishResult, OwnedPublicationResult } from "@/background/services/activity-publication-publisher";
import type { CustomActivityDeletionPlan } from "@/background/services/custom-activity-deletion-plan";
import type { CreatorTestResult } from "@/background/managers/creator-test";
import type { AdminResult, AnnouncementDraft, FieldComment, HiddenPresence, QueueItem, ReviewVerdict, StaffAccess, SubmissionDetail } from "@/shared/admin/admin-types";
import type { CreatorDraft, CreatorExtraction, CreatorPick, CreatorSubmission, CreatorVariable } from "@nowly/presence-creator/creator-types";
import type { ReportMessage, ReportResult, ReportStatus, ReportSummary, StaffReportCounts, StaffReportDetail, StaffReportFilter, StaffReportSummary } from "@/shared/reports";
import type { CreatorAccount, CreatorSubmissionPayload, CreatorSubmitResult } from "@nowly/presence-creator/creator-submission";

export type DiagnosticSnapshot = {
  extensionInstalled: boolean;
  userScriptsActive: boolean;
  hostDetected: boolean;
  discordConnected: boolean;
  presenceInstalled: boolean;
  activityDetected: boolean;
};

export type CreatorPickerLabels = {
  hint: string;
  keys: string;
  cancel: string;
  move: string;
};
export type CreatorPickResult = {
  ok: true;
  pick: CreatorPick;
} | {
  ok: false;
  error: "NO_TAB" | "UNREACHABLE" | "CANCELLED";
};
export type CreatorExtractResult = {
  ok: true;
  extraction: CreatorExtraction;
} | {
  ok: false;
  error: "NO_TAB" | "UNREACHABLE";
  url?: string;
};

export type InstallResult = {
  ok: boolean;
  error?: string;
};
export type InstallFromApiResult = {
  ok: boolean;
  error?: string;
  queued?: boolean;
  status?: number;
};
export type InstallLocalZipResult = {
  ok: boolean;
  error?: string;
  slug?: string;
};
export type InstallLocalZipPayload = {
  fileName: string;
  bytes: string;
};
export type CatalogResponse = {
  ok: true;
  items: PresenceCatalogItem[];
} | {
  ok: false;
  error: string;
};
export type PresenceEngagement = {
  liked: boolean;
  likeCount: number;
  totalInstalls: number;
  activeUsers: number;
};

export type RouterSource = "PRESENCES_POPUP" | "PRESENCES_CONTENT";

export type RouterMessageMap = {
  GET_ACTIVITY_PUBLICATION_STATUS: {
    payload: PublicationReview;
    response: PublicationStatus;
  };
  APPLY_ACTIVITY_PUBLICATION: {
    payload: PublicationApply;
    response: PublicationResult;
  };
  PUBLISH_CUSTOM_ACTIVITY: {
    payload: {
      id: string;
      baseRevision: number;
      unpublish?: boolean;
    };
    response: PublishResult;
  };
  START_CREATOR_CONNECT: {
    payload: void;
    response: {
      ok: boolean;
    };
  };
  ADMIN_GET_ACCESS: {
    payload: void;
    response: StaffAccess | null;
  };
  ADMIN_FETCH_HIDDEN_PRESENCES: {
    payload: void;
    response: AdminResult<HiddenPresence[]>;
  };
  ADMIN_SET_PRESENCE_HIDDEN: {
    payload: {
      slug: string;
      hidden: boolean;
    };
    response: AdminResult<true>;
  };
  ADMIN_DELETE_PRESENCE: {
    payload: {
      slug: string;
    };
    response: AdminResult<true>;
  };
  ADMIN_FETCH_QUEUE: {
    payload: void;
    response: AdminResult<QueueItem[]>;
  };
  SUBMISSION_GET_DETAIL: {
    payload: {
      id: string;
    };
    response: AdminResult<SubmissionDetail>;
  };
  ADMIN_REVIEW: {
    payload: {
      id: string;
      revision: number;
      verdict: ReviewVerdict;
      message: string;
      comments: FieldComment[];
    };
    response: AdminResult<CreatorSubmission>;
  };
  ADMIN_PUBLISH: {
    payload: {
      id: string;
      revision: number;
    };
    response: AdminResult<CreatorSubmission>;
  };
  ADMIN_RETRY_PULL_REQUEST: {
    payload: {
      id: string;
    };
    response: AdminResult<true>;
  };
  ADMIN_CREATE_ANNOUNCEMENT: {
    payload: {
      announcement: AnnouncementDraft;
    };
    response: AdminResult<true>;
  };
  ADMIN_PROBE_CREATOR_PRESENCE: {
    payload: {
      slug: string;
    };
    response: AdminResult<number>;
  };
  ADMIN_LOAD_CREATOR_PRESENCE: {
    payload: {
      slug: string;
    };
    response: AdminResult<CreatorDraft>;
  };
  GET_OWN_ACTIVITY_PUBLICATION: {
    payload: {
      id: string;
    };
    response: OwnedPublicationResult;
  };
  GET_CUSTOM_ACTIVITY_DELETION_PLAN: {
    payload: {
      id: string;
    };
    response: CustomActivityDeletionPlan;
  };
  GET_ANNOUNCEMENTS: {
    payload: void;
    response: AnnouncementsState;
  };
  REFRESH_ANNOUNCEMENTS: {
    payload: {
      locale: string;
    };
    response: AnnouncementsState;
  };
  MARK_ANNOUNCEMENT: {
    payload: {
      id: string;
      action: "read";
    };
    response: AnnouncementsState;
  };
  GET_LEGAL_STATE: {
    payload: void;
    response: LegalState;
  };
  CHECK_LEGAL_DOCUMENTS: {
    payload:
      | {
          force?: boolean;
        }
      | undefined;
    response: LegalState;
  };
  ACCEPT_LEGAL_DOCUMENTS: {
    payload: LegalConfirmation;
    response: LegalConfirmationResult;
  };
  GET_PRESENCES: {
    payload: void;
    response: InstalledPresences;
  };
  GET_NATIVE_STATUS: {
    payload: void;
    response: NativeStatus;
  };
  GET_USER_SCRIPTS_STATUS: {
    payload: void;
    response: UserScriptsStatus;
  };
  GET_DIAGNOSTIC: {
    payload: void;
    response: DiagnosticSnapshot;
  };
  CONNECT_NATIVE: {
    payload: void;
    response: NativeStatus;
  };
  RESTART_NATIVE: {
    payload: void;
    response: NativeStatus;
  };
  ACKNOWLEDGE_DISCORD_IPC_ISSUE: {
    payload: void;
    response: NativeStatus;
  };
  GET_CURRENT_ACTIVITY: {
    payload: void;
    response: CurrentActivity | null;
  };
  GET_DEBUG: {
    payload: void;
    response: PresenceDebug | null;
  };
  TOGGLE_PRESENCE: {
    payload: {
      slug: string;
      enabled: boolean;
    };
    response: {
      ok: boolean;
      error?: string;
    };
  };
  UNINSTALL_PRESENCE: {
    payload: {
      slug: string;
    };
    response: {
      ok: boolean;
    };
  };
  BULK_TOGGLE_PRESENCE: {
    payload: {
      slugs: string[];
      enabled: boolean;
    };
    response: {
      ok: boolean;
    };
  };
  BULK_UNINSTALL_PRESENCE: {
    payload: {
      slugs: string[];
    };
    response: {
      ok: boolean;
    };
  };
  ACTIVITY_UPDATE: {
    payload: {
      slug: string;
      activity: PresenceData;
    };
    response: {
      ok: boolean;
    };
  };
  CLEAR_ACTIVITY: {
    payload: void;
    response: {
      ok: boolean;
    };
  };
  INSTALL_PRESENCE: {
    payload: unknown;
    response: InstallResult;
  };
  UPDATE_PRESENCE: {
    payload: unknown;
    response: InstallResult;
  };
  INSTALL_PRESENCE_FROM_API: {
    payload: {
      slug: string;
    };
    response: InstallFromApiResult;
  };
  INSTALL_LOCAL_PRESENCE_ZIP: {
    payload: InstallLocalZipPayload;
    response: InstallLocalZipResult;
  };
  FETCH_PRESENCE_CATALOG: {
    payload: void;
    response: CatalogResponse;
  };
  GET_PRESENCE_ENGAGEMENT: {
    payload: {
      slug: string;
    };
    response: PresenceEngagement;
  };
  SET_PRESENCE_LIKE: {
    payload: {
      slug: string;
      liked: boolean;
    };
    response: {
      ok: boolean;
      count: number;
    };
  };
  SET_PRESENCE_PAUSE: {
    payload: {
      paused: boolean;
    };
    response: {
      ok: boolean;
      paused?: boolean;
    };
  };
  GET_INSTALL_QUEUE: {
    payload: void;
    response: {
      items: {
        slug: string;
      }[];
    };
  };
  RETRY_INSTALL_QUEUE: {
    payload: void;
    response: {
      slugs: string[];
    };
  };
  CHECK_UPDATES: {
    payload: void;
    response: Record<string, string>;
  };
  GET_SETTINGS: {
    payload: void;
    response: ExtensionSettings;
  };
  SET_SETTINGS: {
    payload: Partial<ExtensionSettings>;
    response: ExtensionSettings;
  };
  GET_ANALYTICS_CONSENT: {
    payload: void;
    response: {
      granted: boolean;
    };
  };
  SET_ANALYTICS_CONSENT: {
    payload: {
      granted: boolean;
    };
    response: {
      granted: boolean;
    };
  };
  RESET_ONBOARDING_FOR_DEV: {
    payload: void;
    response: ExtensionSettings;
  };
  GET_PRESENCE_SETTINGS: {
    payload: void;
    response: Record<string, Record<string, unknown>>;
  };
  SET_PRESENCE_SETTINGS: {
    payload: {
      slug: string;
      partial: Record<string, unknown>;
    };
    response: Record<string, unknown>;
  };
  SNOOZE_PRESENCE: {
    payload: {
      slug: string;
      duration: number;
    };
    response: StoredPresence | null;
  };
  CLEAR_SNOOZE: {
    payload: {
      slug: string;
    };
    response: StoredPresence | null;
  };
  SET_PRESENCE_SCHEDULE: {
    payload: {
      slug: string;
      schedule: PresenceSchedule | undefined;
    };
    response: StoredPresence | null;
  };
  GET_RUNTIME_LOGS: {
    payload: void;
    response: RuntimeLogEntry[];
  };
  CLEAR_RUNTIME_LOGS: {
    payload: void;
    response: {
      ok: boolean;
    };
  };
  RECORD_EXTENSION_ACTIVE: {
    payload: void;
    response: {
      ok: boolean;
    };
  };
  DEBUG: {
    payload: PresenceDebug;
    response: {
      ok: boolean;
    };
  };
  GET_ONBOARDING: {
    payload: void;
    response: OnboardingState;
  };
  SET_ONBOARDING: {
    payload: Partial<OnboardingState>;
    response: OnboardingState;
  };
  GET_TAB_STATE: {
    payload: void;
    response: TabState;
  };
  SET_TAB_MUTED: {
    payload: {
      tabId: number;
      muted: boolean;
    };
    response: TabState;
  };
  REPORT_PRESENCE: {
    payload: {
      slug: string;
      message: string;
      locale?: string;
    };
    response: {
      ok: boolean;
      error?: string;
    };
  };
  REPORT_CREATE: {
    payload: {
      slug: string;
      message: string;
      anonymous: boolean;
      notify: boolean;
      locale?: string;
    };
    response: ReportResult<{
      report: ReportSummary;
    }>;
  };
  ADMIN_REPORT_LIST: {
    payload: {
      filter: StaffReportFilter;
    };
    response: ReportResult<{
      reports: StaffReportSummary[];
      counts: StaffReportCounts;
    }>;
  };
  ADMIN_REPORT_THREAD: {
    payload: {
      id: string;
    };
    response: ReportResult<{
      report: StaffReportDetail;
    }>;
  };
  ADMIN_REPORT_SEND: {
    payload: {
      id: string;
      message: string;
      visibility: "public" | "internal";
      statusTo?: ReportStatus;
      choices?: string[];
      attachments?: string[];
    };
    response: ReportResult<{
      messages: ReportMessage[];
    }>;
  };
  ADMIN_REPORT_ASSIGN: {
    payload: {
      id: string;
      assigneeId: string | null;
    };
    response: ReportResult;
  };
  REPORT_IDENTITY: {
    payload: void;
    response: {
      pseudo: string | null;
    };
  };
  REPORT_LIST: {
    payload: void;
    response: ReportResult<{
      reports: ReportSummary[];
    }>;
  };
  REPORT_THREAD: {
    payload: {
      id: string;
    };
    response: ReportResult<{
      report: ReportSummary;
      messages: ReportMessage[];
    }>;
  };
  REPORT_REPLY: {
    payload: {
      id: string;
      message: string;
      answerTo?: string;
      attachments?: string[];
    };
    response: ReportResult<{
      messages: ReportMessage[];
    }>;
  };
  REPORT_SET_CLOSED: {
    payload: {
      id: string;
      closed: boolean;
    };
    response: ReportResult<ReportSummary>;
  };
  EXPORT_DEVICE_DATA: {
    payload: void;
    response: {
      ok: boolean;
      data?: unknown;
      error?: string;
    };
  };
  CREATOR_PICK_START: {
    payload: {
      labels: CreatorPickerLabels;
    };
    response: CreatorPickResult;
  };
  CREATOR_PICK_CANCEL: {
    payload: void;
    response: {
      ok: boolean;
    };
  };
  CREATOR_EXTRACT: {
    payload: {
      variables: CreatorVariable[];
    };
    response: CreatorExtractResult;
  };
  CREATOR_HIGHLIGHT: {
    payload: {
      selector: string;
    };
    response: {
      ok: boolean;
    };
  };
  CREATOR_TEST_ACTIVITY: {
    payload: {
      activity: PresenceData | null;
    };
    response: CreatorTestResult;
  };
  CREATOR_GET_ACCOUNT: {
    payload: void;
    response: CreatorAccount | null;
  };
  CREATOR_SUBMIT: {
    payload: CreatorSubmissionPayload;
    response: CreatorSubmitResult;
  };
  CREATOR_FETCH_SUBMISSIONS: {
    payload: {
      ids: string[];
    };
    response: CreatorSubmission[];
  };
  CREATOR_SYNC_DRAFTS: {
    payload: void;
    response: void;
  };
  DELETE_DEVICE_DATA: {
    payload: void;
    response: {
      ok: boolean;
      error?: string;
    };
  };
  SYNC_PRESENCE_SCRIPTS: {
    payload: void;
    response: {
      ok: boolean;
    };
  };
  GET_CUSTOM_ACTIVITIES: {
    payload: void;
    response: CustomActivitiesState;
  };
  GET_CUSTOM_ACTIVITY_DETECTION: {
    payload: void;
    response: CustomActivityDetection | null;
  };
  SAVE_CUSTOM_ACTIVITY: {
    payload: {
      draft: CustomActivityDraft;
      expectedUpdatedAt?: number;
    };
    response: SaveCustomActivityResult;
  };
  DELETE_CUSTOM_ACTIVITY: {
    payload: {
      id: string;
    };
    response: {
      ok: boolean;
      error?: import("@/background/services/activity-publication-deletion").PublicationDeletionError;
    };
  };
  SET_CUSTOM_ACTIVITY_ACTIVE: {
    payload: {
      id: string | null;
    };
    response: CustomActivitiesState;
  };
  UPLOAD_CUSTOM_IMAGE: {
    payload: {
      dataUrl: string;
    };
    response: UploadCustomImageResult;
  };
  GET_CUSTOM_IMAGES: {
    payload: {
      hashes: string[];
    };
    response: Record<string, string>;
  };
  GET_ACCOUNT: {
    payload: void;
    response: AccountSnapshot;
  };
  START_ACCOUNT_CONNECT: {
    payload: void;
    response: {
      ok: boolean;
    };
  };
  NOWLY_SESSION: {
    payload: unknown;
    response: {
      ok: boolean;
      error?: string;
    };
  };
  SYNC_ACCOUNT: {
    payload: void;
    response: AccountSnapshot;
  };
  RESOLVE_SYNC_CHOICE: {
    payload: {
      choice: SyncChoice;
    };
    response: AccountSnapshot;
  };
  SIGN_OUT_ACCOUNT: {
    payload: void;
    response: AccountSnapshot;
  };
  STOP_ACCOUNT_SYNC: {
    payload: void;
    response: {
      ok: boolean;
      error?: string;
    };
  };
  RECORD_USAGE_DAY: {
    payload: void;
    response: {
      ok: boolean;
    };
  };
  SNOOZE_SUPPORT_PROMPT: {
    payload: {
      action: SupportPromptAction;
    };
    response: SupportPromptState;
  };
};

export type RouterMessageType = keyof RouterMessageMap;
export type PayloadOf<K extends RouterMessageType> = RouterMessageMap[K]["payload"];
export type ResponseOf<K extends RouterMessageType> = RouterMessageMap[K]["response"];

export type RouterRequest<K extends RouterMessageType = RouterMessageType> = {
  source: RouterSource;
  type: K;
  payload: PayloadOf<K>;
};
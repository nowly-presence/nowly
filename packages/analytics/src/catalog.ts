export type AnalyticsGroup =
  | "extension"
  | "native"
  | "presence"
  | "marketplace"
  | "uninstall"
  | "settings"
  | "ratings"
  | "release"

export type AnalyticsMetric = {
  key: string
  label: string
  description: string
  group: AnalyticsGroup
  private?: boolean
  dimensions: string[]
  allowedPayloadKeys?: string[]
  retentionDays?: number
}

export class Analytics {
  readonly key: string
  readonly label: string
  readonly description: string
  readonly group: AnalyticsGroup
  readonly private: boolean
  readonly dimensions: string[]
  readonly allowedPayloadKeys: string[]
  readonly retentionDays?: number

  constructor(metric: AnalyticsMetric) {
    this.key = metric.key
    this.label = metric.label
    this.description = metric.description
    this.group = metric.group
    this.private = metric.private ?? false
    this.dimensions = metric.dimensions
    this.allowedPayloadKeys = metric.allowedPayloadKeys ?? metric.dimensions
    this.retentionDays = metric.retentionDays
  }

  toJSON(): AnalyticsMetric & { private: boolean } {
    return {
      key: this.key,
      label: this.label,
      description: this.description,
      group: this.group,
      private: this.private,
      dimensions: this.dimensions,
      allowedPayloadKeys: this.allowedPayloadKeys,
      retentionDays: this.retentionDays,
    }
  }
}

export const analyticsRegistry = [
  new Analytics({
    key: "extension_install",
    label: "Extension install",
    description: "Extension installation lifecycle event.",
    group: "extension",
    dimensions: ["extensionVersion", "browser", "os", "locale", "source"],
  }),
  new Analytics({
    key: "extension_update",
    label: "Extension update",
    description: "Extension update lifecycle event.",
    group: "extension",
    dimensions: ["extensionVersion", "browser", "os", "locale", "source"],
  }),
  new Analytics({
    key: "extension_open",
    label: "Extension open",
    description: "Extension UI opened.",
    group: "extension",
    dimensions: ["extensionVersion", "browser", "os", "locale", "surface"],
  }),
  new Analytics({
    key: "onboarding_started",
    label: "Onboarding started",
    description: "Onboarding flow was shown.",
    group: "extension",
    dimensions: ["extensionVersion", "browser", "os", "locale", "source"],
  }),
  new Analytics({
    key: "onboarding_completed",
    label: "Onboarding completed",
    description: "Onboarding flow was completed.",
    group: "extension",
    dimensions: ["extensionVersion", "browser", "os", "locale", "source"],
  }),
  new Analytics({
    key: "onboarding_skipped",
    label: "Onboarding skipped",
    description: "Onboarding flow was skipped.",
    group: "extension",
    dimensions: ["extensionVersion", "browser", "os", "locale", "source"],
  }),
  new Analytics({
    key: "onboarding_gate_seen",
    label: "Onboarding gate seen",
    description: "Onboarding permission or native gate was displayed.",
    group: "extension",
    dimensions: ["extensionVersion", "browser", "os", "locale", "gate"],
  }),
  new Analytics({
    key: "analytics_consent_accepted",
    label: "Analytics consent accepted",
    description: "Optional analytics consent was accepted.",
    group: "extension",
    dimensions: ["extensionVersion", "browser", "os", "locale", "source"],
  }),
  new Analytics({
    key: "analytics_consent_declined",
    label: "Analytics consent declined",
    description: "Optional analytics consent was declined.",
    group: "extension",
    dimensions: ["extensionVersion", "browser", "os", "locale", "source"],
  }),
  new Analytics({
    key: "analytics_consent_changed",
    label: "Analytics consent changed",
    description: "Optional analytics consent was changed later in settings.",
    group: "extension",
    dimensions: ["extensionVersion", "browser", "os", "locale", "enabled", "source"],
  }),
  new Analytics({
    key: "native_connected",
    label: "Native connected",
    description: "Native client connection succeeded.",
    group: "native",
    dimensions: ["extensionVersion", "nativeVersion", "browser", "os"],
  }),
  new Analytics({
    key: "native_disconnected",
    label: "Native disconnected",
    description: "Native client disconnected.",
    group: "native",
    private: true,
    dimensions: ["extensionVersion", "nativeVersion", "browser", "os", "reason"],
    retentionDays: 90,
  }),
  new Analytics({
    key: "native_heartbeat_ok",
    label: "Native heartbeat OK",
    description: "Native client heartbeat succeeded.",
    group: "native",
    dimensions: ["extensionVersion", "nativeVersion", "browser", "os"],
  }),
  new Analytics({
    key: "native_heartbeat_failed",
    label: "Native heartbeat failed",
    description: "Native client heartbeat failed.",
    group: "native",
    private: true,
    dimensions: ["extensionVersion", "nativeVersion", "browser", "os", "reason"],
    retentionDays: 90,
  }),
  new Analytics({
    key: "native_version_outdated",
    label: "Native version outdated",
    description: "Native client version is older than expected.",
    group: "native",
    dimensions: ["extensionVersion", "nativeVersion", "browser", "os"],
  }),
  new Analytics({
    key: "native_reconnect",
    label: "Native reconnect",
    description: "Native client reconnect was requested.",
    group: "native",
    dimensions: ["extensionVersion", "nativeVersion", "browser", "os", "source"],
  }),
  new Analytics({
    key: "presence_install",
    label: "Presence install",
    description: "Presence installation by slug and version.",
    group: "presence",
    dimensions: ["slug", "version", "source"],
  }),
  new Analytics({
    key: "presence_update",
    label: "Presence update",
    description: "Presence update by slug and version.",
    group: "presence",
    dimensions: ["slug", "version", "source"],
  }),
  new Analytics({
    key: "presence_uninstall",
    label: "Presence uninstall",
    description: "Presence uninstall by slug.",
    group: "presence",
    dimensions: ["slug", "version", "source"],
  }),
  new Analytics({
    key: "presence_toggle",
    label: "Presence toggle",
    description: "Presence enabled or disabled.",
    group: "presence",
    dimensions: ["slug", "version", "enabled"],
  }),
  new Analytics({
    key: "presence_active_heartbeat",
    label: "Presence active heartbeat",
    description: "Presence active heartbeat by slug.",
    group: "presence",
    dimensions: ["slug", "version", "source"],
  }),
  new Analytics({
    key: "presence_session_start",
    label: "Presence session start",
    description: "Presence usage session started.",
    group: "presence",
    private: true,
    dimensions: ["slug", "version", "browser", "os"],
    retentionDays: 180,
  }),
  new Analytics({
    key: "presence_session_end",
    label: "Presence session end",
    description: "Presence usage session ended.",
    group: "presence",
    private: true,
    dimensions: ["slug", "version", "browser", "os", "durationMs", "reason"],
    retentionDays: 180,
  }),
  new Analytics({
    key: "presence_error",
    label: "Presence error",
    description: "Aggregated technical errors by presence, extension version, and runtime stage.",
    group: "presence",
    private: true,
    dimensions: ["slug", "version", "stage", "browser", "os"],
    retentionDays: 90,
  }),
  new Analytics({
    key: "marketplace_page_view",
    label: "Marketplace page view",
    description: "Public marketplace page view without URL, query, or user identity.",
    group: "marketplace",
    dimensions: ["slug", "source", "locale"],
  }),
  new Analytics({
    key: "marketplace_install_click",
    label: "Marketplace install click",
    description: "Install button clicked from marketplace.",
    group: "marketplace",
    dimensions: ["slug", "source", "locale"],
  }),
  new Analytics({
    key: "marketplace_conversion",
    label: "Marketplace conversion",
    description: "Install conversion after marketplace interaction.",
    group: "marketplace",
    dimensions: ["slug", "source", "locale"],
  }),
  new Analytics({
    key: "marketplace_filter",
    label: "Marketplace filter",
    description: "Marketplace filtering usage without search terms.",
    group: "marketplace",
    dimensions: ["source", "locale", "category", "sort", "resultCount"],
  }),
  new Analytics({
    key: "marketplace_no_results",
    label: "Marketplace no results",
    description: "Marketplace filter/search produced no results, without storing the search query.",
    group: "marketplace",
    dimensions: ["source", "locale", "category", "sort"],
  }),
  new Analytics({
    key: "uninstall_cleanup_received",
    label: "Uninstall cleanup received",
    description: "Best-effort extension uninstall cleanup page was opened.",
    group: "uninstall",
    dimensions: ["source"],
  }),
  new Analytics({
    key: "uninstall_cleanup_success",
    label: "Uninstall cleanup success",
    description: "Best-effort uninstall active cleanup succeeded.",
    group: "uninstall",
    private: true,
    dimensions: ["source"],
    retentionDays: 90,
  }),
  new Analytics({
    key: "uninstall_cleanup_error",
    label: "Uninstall cleanup error",
    description: "Best-effort uninstall active cleanup failed.",
    group: "uninstall",
    private: true,
    dimensions: ["source", "stage"],
    retentionDays: 90,
  }),
  new Analytics({
    key: "uninstall_analytics_deleted",
    label: "Uninstall analytics deleted",
    description: "Device-level analytics deletion was requested from uninstall page.",
    group: "uninstall",
    private: true,
    dimensions: ["source"],
    retentionDays: 90,
  }),
  new Analytics({
    key: "uninstall_analytics_kept",
    label: "Uninstall analytics kept",
    description: "Uninstall flow left anonymous analytics in place.",
    group: "uninstall",
    dimensions: ["source"],
  }),
  new Analytics({
    key: "settings_display_changed",
    label: "Display settings changed",
    description: "Display preference changed.",
    group: "settings",
    dimensions: ["extensionVersion", "browser", "os", "displayMode", "separateActivePresence", "showPlayer"],
  }),
  new Analytics({
    key: "settings_language_changed",
    label: "Language settings changed",
    description: "Language preference changed.",
    group: "settings",
    dimensions: ["extensionVersion", "browser", "os", "locale"],
  }),
  new Analytics({
    key: "settings_custom_api_changed",
    label: "Custom API setting changed",
    description: "Custom API setting was enabled or disabled, without storing the URL.",
    group: "settings",
    private: true,
    dimensions: ["extensionVersion", "browser", "os", "enabled"],
    retentionDays: 90,
  }),
  new Analytics({
    key: "settings_presence_changed",
    label: "Presence settings changed",
    description: "Per-presence settings changed without storing setting values.",
    group: "settings",
    dimensions: ["slug", "version", "settingCount"],
  }),
  new Analytics({
    key: "ratings",
    label: "Ratings",
    description: "Rating averages, counts, and star distributions.",
    group: "ratings",
    dimensions: ["slug"],
  }),
  new Analytics({
    key: "release_adoption",
    label: "Release adoption",
    description: "Installed device counts by presence version.",
    group: "release",
    dimensions: ["slug", "version"],
  }),
] as const

export type AnalyticsEventKey = (typeof analyticsRegistry)[number]["key"]

export const getAnalyticsMetric = (key: string): Analytics | undefined =>
  analyticsRegistry.find((metric) => metric.key === key)

export const isAnalyticsEventKey = (key: string): key is AnalyticsEventKey =>
  Boolean(getAnalyticsMetric(key))

export const catalogPublicJson = () => analyticsRegistry.map((metric) => metric.toJSON())

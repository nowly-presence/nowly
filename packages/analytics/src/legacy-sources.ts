/**
 * Inventory of the previous product-analytics implementation.
 * Keys are preserved in the catalog even when they were never emitted.
 * Clients (extension / web) are intentionally not wired to AnalyticsClient yet.
 */

export type LegacySourceStatus = "tracked" | "never-tracked" | "duplicate-risk"

export type LegacySource = {
  key: string
  surface: "extension" | "web" | "api" | "none"
  status: LegacySourceStatus
  callSites: string[]
  notes: string
}

export const legacySources: LegacySource[] = [
  {
    key: "extension_install",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/services/lifecycle.ts (onInstalled)"],
    notes: "Fired with extension_update on the same listener depending on details.reason.",
  },
  {
    key: "extension_update",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/services/lifecycle.ts (onInstalled)"],
    notes: "Shares the install listener.",
  },
  {
    key: "extension_open",
    surface: "extension",
    status: "duplicate-risk",
    callSites: [
      "apps/extension/src/background/services/message-router.ts GET_PRESENCES/GET_INSTALLED",
      "apps/extension/src/background/services/message-router.ts GET_SETTINGS",
    ],
    notes: "trackExtensionOpen was debounced to 60s but invoked from two message types.",
  },
  {
    key: "onboarding_started",
    surface: "none",
    status: "never-tracked",
    callSites: [],
    notes: "Catalog only. No emitter in extension or web.",
  },
  {
    key: "onboarding_completed",
    surface: "none",
    status: "never-tracked",
    callSites: [],
    notes: "Catalog only. Used by the activation funnel definition.",
  },
  {
    key: "onboarding_skipped",
    surface: "none",
    status: "never-tracked",
    callSites: [],
    notes: "Catalog only.",
  },
  {
    key: "onboarding_gate_seen",
    surface: "none",
    status: "never-tracked",
    callSites: [],
    notes: "Catalog only.",
  },
  {
    key: "analytics_consent_accepted",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/managers/settings-manager.ts"],
    notes: "Also immediately followed by analytics_consent_changed.",
  },
  {
    key: "analytics_consent_declined",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/managers/settings-manager.ts"],
    notes: "Also immediately followed by analytics_consent_changed.",
  },
  {
    key: "analytics_consent_changed",
    surface: "extension",
    status: "duplicate-risk",
    callSites: ["apps/extension/src/background/managers/settings-manager.ts"],
    notes: "Always paired with accepted/declined on the same toggle.",
  },
  {
    key: "native_connected",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/services/lifecycle.ts native CONNECTED"],
    notes: "",
  },
  {
    key: "native_disconnected",
    surface: "none",
    status: "never-tracked",
    callSites: [],
    notes: "Catalog only. Heartbeat failed was used instead.",
  },
  {
    key: "native_heartbeat_ok",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/services/lifecycle.ts heartbeat"],
    notes: "",
  },
  {
    key: "native_heartbeat_failed",
    surface: "extension",
    status: "tracked",
    callSites: [
      "apps/extension/src/background/services/lifecycle.ts native error",
      "apps/extension/src/background/services/lifecycle.ts heartbeat",
    ],
    notes: "",
  },
  {
    key: "native_version_outdated",
    surface: "none",
    status: "never-tracked",
    callSites: [],
    notes: "Catalog only.",
  },
  {
    key: "native_reconnect",
    surface: "extension",
    status: "duplicate-risk",
    callSites: [
      "apps/extension/src/background/services/message-router.ts CONNECT_NATIVE",
      "apps/extension/src/background/services/message-router.ts RESTART_NATIVE",
    ],
    notes: "Same key, different payload.source.",
  },
  {
    key: "presence_install",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/managers/presence-manager.ts"],
    notes: "Not emitted from marketplace; marketplace used marketplace_conversion.",
  },
  {
    key: "presence_update",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/managers/presence-manager.ts"],
    notes: "",
  },
  {
    key: "presence_uninstall",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/managers/presence-manager.ts"],
    notes: "",
  },
  {
    key: "presence_toggle",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/managers/presence-manager.ts"],
    notes: "",
  },
  {
    key: "presence_active_heartbeat",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/services/alarms.ts api-heartbeat"],
    notes: "Orthogonal to POST /presences/active (product stats, kept).",
  },
  {
    key: "presence_session_start",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/managers/activity-manager.ts addActiveSlug"],
    notes: "",
  },
  {
    key: "presence_session_end",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/managers/activity-manager.ts removeActiveSlug"],
    notes: "",
  },
  {
    key: "presence_error",
    surface: "extension",
    status: "tracked",
    callSites: [
      "apps/extension/src/background/managers/activity-manager.ts security",
      "apps/extension/src/background/runtime/presence-scripts.ts userScripts",
      "apps/extension/src/background/runtime/presence-runtime-bridge.ts DEBUG",
    ],
    notes: "DEBUG messages were counted as presence_error.",
  },
  {
    key: "marketplace_page_view",
    surface: "web",
    status: "tracked",
    callSites: ["apps/web/components/library/marketplace-client.tsx"],
    notes: "Fired on locale effect, not per presence slug.",
  },
  {
    key: "marketplace_install_click",
    surface: "web",
    status: "tracked",
    callSites: ["apps/web/components/library/presence-detail/use-presence-status.ts"],
    notes: "",
  },
  {
    key: "marketplace_conversion",
    surface: "web",
    status: "tracked",
    callSites: ["apps/web/components/library/presence-detail/use-presence-status.ts"],
    notes: "Web conversion, not presence_install.",
  },
  {
    key: "marketplace_filter",
    surface: "web",
    status: "tracked",
    callSites: ["apps/web/components/library/marketplace-client.tsx"],
    notes: "",
  },
  {
    key: "marketplace_no_results",
    surface: "web",
    status: "tracked",
    callSites: ["apps/web/components/library/marketplace-client.tsx"],
    notes: "Shares the filter effect; mutually exclusive with marketplace_filter.",
  },
  {
    key: "uninstall_cleanup_received",
    surface: "web",
    status: "duplicate-risk",
    callSites: [
      "apps/web/app/uninstall/page.tsx",
      "apps/api/src/features/analytics/analytics.routes.ts DELETE /devices/:deviceId",
    ],
    notes: "Page tracked it and the API also recorded it on device delete.",
  },
  {
    key: "uninstall_cleanup_success",
    surface: "web",
    status: "tracked",
    callSites: ["apps/web/app/uninstall/page.tsx"],
    notes: "",
  },
  {
    key: "uninstall_cleanup_error",
    surface: "web",
    status: "tracked",
    callSites: ["apps/web/app/uninstall/page.tsx"],
    notes: "",
  },
  {
    key: "uninstall_analytics_deleted",
    surface: "web",
    status: "tracked",
    callSites: ["apps/web/app/uninstall/page.tsx"],
    notes: "Consent/GDPR delete UI removed; key kept for funnel history.",
  },
  {
    key: "uninstall_analytics_kept",
    surface: "web",
    status: "tracked",
    callSites: ["apps/web/app/uninstall/page.tsx"],
    notes: "Consent/GDPR keep UI removed; key kept for funnel history.",
  },
  {
    key: "settings_display_changed",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/managers/settings-manager.ts"],
    notes: "",
  },
  {
    key: "settings_language_changed",
    surface: "none",
    status: "never-tracked",
    callSites: [],
    notes: "Catalog only. Locale changes did not emit this key.",
  },
  {
    key: "settings_custom_api_changed",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/managers/settings-manager.ts"],
    notes: "",
  },
  {
    key: "settings_presence_changed",
    surface: "extension",
    status: "tracked",
    callSites: ["apps/extension/src/background/services/message-router.ts SET_PRESENCE_SETTINGS"],
    notes: "",
  },
  {
    key: "ratings",
    surface: "none",
    status: "never-tracked",
    callSites: [],
    notes: "Read-model metric, never ingested as an event.",
  },
  {
    key: "release_adoption",
    surface: "none",
    status: "never-tracked",
    callSites: [],
    notes: "Read-model metric, never ingested as an event.",
  },
]

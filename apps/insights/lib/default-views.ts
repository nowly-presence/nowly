import type { ViewConfig } from "@nowly/analytics";

export const DEFAULT_VIEW_SLUGS = ["overview", "installs", "funnels", "errors"] as const;
export type DefaultViewSlug = (typeof DEFAULT_VIEW_SLUGS)[number];

export const DEFAULT_VIEW_LABELS: Record<DefaultViewSlug, string> = {
  overview: "Overview",
  installs: "Installations",
  funnels: "Funnels",
  errors: "Errors & Uninstalls",
};

export const DEFAULT_VIEWS: Record<Exclude<DefaultViewSlug, "overview">, ViewConfig> = {
  installs: {
    name: "Installations",
    widgets: [
      {
        id: "extension-install",
        title: "Extension installs",
        kind: "metric-series",
        metric: "extension_install",
        filters: {},
        range: "7d",
        chartType: "line",
      },
      {
        id: "presence-install",
        title: "Presence installs",
        kind: "metric-series",
        metric: "presence_install",
        filters: {},
        range: "7d",
        chartType: "line",
      },
    ],
  },
  funnels: {
    name: "Funnels",
    widgets: [
      { id: "acquisition-marketplace", title: "Acquisition (marketplace)", kind: "funnel", funnelId: "acquisition-marketplace", filters: {}, range: "30d" },
      { id: "activation", title: "Activation", kind: "funnel", funnelId: "activation", filters: {}, range: "30d" },
      { id: "native", title: "Native", kind: "funnel", funnelId: "native", filters: {}, range: "30d" },
    ],
  },
  errors: {
    name: "Errors & Uninstalls",
    widgets: [
      {
        id: "presence-error",
        title: "Presence errors",
        kind: "metric-series",
        metric: "presence_error",
        filters: {},
        range: "7d",
        chartType: "bar",
      },
      {
        id: "native-heartbeat-failed",
        title: "Native heartbeat failures",
        kind: "metric-series",
        metric: "native_heartbeat_failed",
        filters: {},
        range: "7d",
        chartType: "bar",
      },
      { id: "uninstall", title: "Uninstall", kind: "funnel", funnelId: "uninstall", filters: {}, range: "30d" },
    ],
  },
};

export const isDefaultViewSlug = (value: string): value is DefaultViewSlug =>
  (DEFAULT_VIEW_SLUGS as readonly string[]).includes(value);

import { FUNNEL_IDS } from "@/lib/catalog";
import { ANALYTICS_RANGE_IDS, ANALYTICS_SOURCES, analyticsRegistry } from "@nowly/analytics";
import { tool } from "ai";
import { z } from "zod";

const metricKeys = analyticsRegistry.map((m) => m.key) as [string, ...string[]];
const funnelIds = FUNNEL_IDS;

const rangeEnum = z.enum(ANALYTICS_RANGE_IDS);
const sourceEnum = z.enum(ANALYTICS_SOURCES);
const granularityEnum = z.enum(["second", "minute", "hour", "day"]);
const chartTypeEnum = z.enum(["line", "bar", "area"]);

const filtersSchema = z
  .object({
    slug: z.string().trim().min(1).optional().describe("Presence slug, e.g. 'youtube'"),
    source: sourceEnum.optional(),
    country: z.string().length(2).optional().describe("ISO 3166-1 alpha-2 country code"),
    browser: z.string().trim().min(1).optional().describe("e.g. 'firefox', 'chrome', 'edge'"),
    os: z.string().trim().min(1).optional().describe("e.g. 'windows', 'macos', 'linux'"),
    locale: z.string().trim().min(1).optional(),
  })
  .describe("All fields optional; omit any dimension the user did not mention.");

// Either a preset `range` (default "7d") OR an explicit `from`/`to` ISO
// datetime pair for a custom window - from/to win when both are present.
const windowFields = {
  range: rangeEnum.default("7d").describe("Ignored if from/to are both set."),
  from: z.string().datetime().optional().describe("Custom window start, ISO datetime. Requires `to` too."),
  to: z.string().datetime().optional().describe("Custom window end, ISO datetime. Requires `from` too."),
};

const widgetSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("metric-total"),
    metric: z.enum(metricKeys),
    filters: filtersSchema.optional(),
    ...windowFields,
  }),
  z.object({
    kind: z.literal("metric-series"),
    metric: z.enum(metricKeys),
    filters: filtersSchema.optional(),
    ...windowFields,
    granularity: granularityEnum.optional(),
    chartType: chartTypeEnum.default("line"),
    compare: z.boolean().optional().describe("Overlay the immediately preceding period of the same length for comparison."),
  }),
  z.object({
    kind: z.literal("funnel"),
    funnelId: z.enum(funnelIds),
    filters: filtersSchema.optional(),
    ...windowFields,
  }),
]);

const toQueryString = (filters?: Record<string, string | undefined>): string =>
  new URLSearchParams(Object.entries(filters ?? {}).filter(([, v]) => v) as [string, string][]).toString();

const windowQueryString = (window: { range: string; from?: string; to?: string }): string =>
  window.from && window.to ? `from=${encodeURIComponent(window.from)}&to=${encodeURIComponent(window.to)}` : `range=${window.range}`;

export const insightsTools = (opts: { apiBaseUrl: string; cookie: string }) => {
  const call = async (path: string, init?: RequestInit) => {
    const res = await fetch(`${opts.apiBaseUrl}${path}`, {
      ...init,
      headers: { cookie: opts.cookie, ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    });
    if (!res.ok) throw new Error(`Insights API ${path} failed: ${res.status}`);
    return res.json();
  };

  return {
    listCatalog: tool({
      description:
        "List every available analytics metric, funnel, and traffic source. Call this first if unsure which metric/funnel key matches the user's request.",
      inputSchema: z.object({}),
      execute: async () => call("/insights/catalog"),
    }),

    getOverviewTotals: tool({
      description: "Get total event count, unique devices, and top events for a time range and optional filters.",
      inputSchema: z.object({ ...windowFields, filters: filtersSchema.optional() }),
      execute: async ({ filters, ...window }) => call(`/insights/overview?${windowQueryString(window)}&${toQueryString(filters)}`),
    }),

    getMetricSeries: tool({
      description:
        "Get a time series (bucketed counts) for one metric key, with optional dimension filters and an optional comparison " +
        "to the immediately preceding period of the same length. Use listCatalog first if unsure of the exact metric key.",
      inputSchema: z.object({
        metric: z.enum(metricKeys).describe("Exact metric key from the catalog, e.g. 'presence_install'"),
        ...windowFields,
        granularity: granularityEnum.optional(),
        compare: z.boolean().optional(),
        filters: filtersSchema.optional(),
      }),
      execute: async ({ metric, granularity, compare, filters, ...window }) =>
        call(
          `/insights/series?metric=${metric}&${windowQueryString(window)}${granularity ? `&granularity=${granularity}` : ""}${compare ? "&compare=true" : ""}&${toQueryString(filters)}`,
        ),
    }),

    getFunnel: tool({
      description: "Get step-by-step conversion for one funnel.",
      inputSchema: z.object({
        funnelId: z.enum(funnelIds),
        ...windowFields,
        filters: filtersSchema.optional(),
      }),
      execute: async ({ funnelId, filters, ...window }) => call(`/insights/funnels/${funnelId}?${windowQueryString(window)}&${toQueryString(filters)}`),
    }),

    generateView: tool({
      description:
        "Render one widget (chart/stat/funnel) live in the chat, with a manual 'Save as view' button for the user. " +
        "Only call this when the user explicitly asks to see a chart/graph/visualization - never for a plain question " +
        "that can be answered with a number or short text from the other tools.",
      inputSchema: z.object({
        title: z.string().min(1).max(80),
        widget: widgetSchema,
      }),
      execute: async ({ title, widget }) => ({ title, widget }),
    }),

    listViews: tool({
      description: "List the saved dashboard views (id and name only). Use this to find a view the user refers to by name before updating it.",
      inputSchema: z.object({}),
      execute: async () => call("/insights/views"),
    }),

    createView: tool({
      description:
        "Persist a new saved dashboard view with one widget. Only call this when the user explicitly asks to create or save a view - " +
        "never as a side effect of just answering a question.",
      inputSchema: z.object({
        name: z.string().min(1).max(80),
        title: z.string().min(1).max(80),
        widget: widgetSchema,
      }),
      execute: async ({ name, title, widget }) =>
        call("/insights/views", {
          method: "POST",
          body: JSON.stringify({ name, widgets: [{ id: crypto.randomUUID(), title, ...widget }] }),
        }),
    }),

    addWidgetToView: tool({
      description:
        "Add one more widget to an existing saved view (fetches the view, appends the widget, saves it back). " +
        "Only call this when the user explicitly asks to add something to an existing view. Use listViews first to find the view id.",
      inputSchema: z.object({
        viewId: z.string(),
        title: z.string().min(1).max(80),
        widget: widgetSchema,
      }),
      execute: async ({ viewId, title, widget }) => {
        const view = await call(`/insights/views/${viewId}`);
        const widgets = [...view.widgets, { id: crypto.randomUUID(), title, ...widget }];
        return call(`/insights/views/${viewId}`, { method: "PATCH", body: JSON.stringify({ name: view.name, widgets }) });
      },
    }),
  };
};

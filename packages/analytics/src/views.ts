import type { AnalyticsGranularity, AnalyticsRangeId } from "./ranges"

export type InsightsFilters = {
  slug?: string
  source?: string
  country?: string
  browser?: string
  os?: string
  locale?: string
}

export type ChartType = "line" | "bar" | "area"

// "custom" pairs with an explicit `from`/`to` (ISO date strings) instead of a
// fixed-length preset id.
export type WidgetRange = AnalyticsRangeId | "custom"

export type WidgetConfig =
  | {
      id: string
      title: string
      kind: "metric-total"
      metric: string
      filters: InsightsFilters
      range: WidgetRange
      from?: string
      to?: string
    }
  | {
      id: string
      title: string
      kind: "metric-series"
      metric: string
      filters: InsightsFilters
      range: WidgetRange
      from?: string
      to?: string
      granularity?: AnalyticsGranularity
      chartType: ChartType
      compare?: boolean
    }
  | {
      id: string
      title: string
      kind: "funnel"
      funnelId: string
      filters: InsightsFilters
      range: WidgetRange
      from?: string
      to?: string
    }

export type ViewConfig = {
  id?: string
  name: string
  widgets: WidgetConfig[]
}

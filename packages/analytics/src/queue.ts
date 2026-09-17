import { MAX_ANALYTICS_EVENTS_PER_BATCH } from "./policies"
import type { OutboundAnalyticsEvent } from "./transport"

export class AnalyticsQueue {
  private items: OutboundAnalyticsEvent[] = []

  enqueue(event: OutboundAnalyticsEvent): number {
    this.items.push(event)
    return this.items.length
  }

  drain(limit = MAX_ANALYTICS_EVENTS_PER_BATCH): OutboundAnalyticsEvent[] {
    return this.items.splice(0, Math.min(limit, this.items.length))
  }

  restore(events: OutboundAnalyticsEvent[]): void {
    this.items.unshift(...events)
  }

  get size(): number {
    return this.items.length
  }
}

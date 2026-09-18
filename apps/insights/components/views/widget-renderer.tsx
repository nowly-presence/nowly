"use client";

import { WidgetCardStat } from "@/components/views/widget-card-stat";
import { WidgetChart } from "@/components/views/widget-chart";
import { WidgetFunnel } from "@/components/views/widget-funnel";
import type { WidgetConfig } from "@nowly/analytics";

export const WidgetRenderer = ({ widget }: { widget: WidgetConfig }) => {
  switch (widget.kind) {
    case "metric-total":
      return <WidgetCardStat widget={widget} />;
    case "metric-series":
      return <WidgetChart widget={widget} />;
    case "funnel":
      return <WidgetFunnel widget={widget} />;
  }
};

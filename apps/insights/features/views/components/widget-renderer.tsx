"use client";

import { WidgetCardStat } from "@/features/views/components/widget-card-stat";
import { WidgetChart } from "@/features/views/components/widget-chart";
import { WidgetFunnel } from "@/features/views/components/widget-funnel";
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

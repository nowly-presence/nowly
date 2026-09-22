"use client";

import { Card, CardContent, CardDescription, CardTitle, Skeleton } from "@nowly/ui";
import { apiFetch } from "@/features/api-target/lib/api-client";
import type { WidgetConfig } from "@nowly/analytics";
import { useEffect, useState } from "react";

type FunnelStepResult = {
  label: string;
  uniqueDevices: number;
  conversionFromPrevious: number | null;
  conversionFromStart: number | null;
  dropOff: number | null;
};

type FunnelMeasurement = {
  label: string;
  steps: FunnelStepResult[];
  overallConversion: number | null;
};

const buildQuery = (widget: Extract<WidgetConfig, { kind: "funnel" }>): string => {
  const params = new URLSearchParams();
  if (widget.range === "custom" && widget.from && widget.to) {
    params.set("from", widget.from);
    params.set("to", widget.to);
  } else {
    params.set("range", widget.range);
  }
  for (const [key, value] of Object.entries(widget.filters)) {
    if (value) params.set(key, value);
  }
  return params.toString();
};

export const WidgetFunnel = ({ widget }: { widget: Extract<WidgetConfig, { kind: "funnel" }> }) => {
  const [measurement, setMeasurement] = useState<FunnelMeasurement | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMeasurement(null);
    setError(false);

    apiFetch<FunnelMeasurement>(`/insights/funnels/${widget.funnelId}?${buildQuery(widget)}`)
      .then((data) => {
        if (!cancelled) setMeasurement(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [widget]);

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <CardDescription className="truncate">{widget.title}</CardDescription>
            <CardTitle className="mt-1 truncate text-base font-medium">
              {measurement ? measurement.label : widget.funnelId}
            </CardTitle>
          </div>
          {measurement?.overallConversion !== null && measurement?.overallConversion !== undefined ? (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-foreground">
              {measurement.overallConversion}%
            </span>
          ) : null}
        </div>

        {measurement === null && !error ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error || !measurement ? (
          <div className="mt-4 flex h-20 items-center justify-center text-sm text-muted-foreground">
            Could not load data
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {measurement.steps.map((step, index) => (
              <div key={`${step.label}-${index}`} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span className="text-foreground">{step.label}</span>
                <span className="flex items-center gap-3 text-muted-foreground">
                  <span className="font-medium text-foreground">{step.uniqueDevices.toLocaleString()}</span>
                  {step.conversionFromPrevious !== null ? <span>{step.conversionFromPrevious}%</span> : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

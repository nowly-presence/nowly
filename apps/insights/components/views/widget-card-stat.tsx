"use client";

import { Card, CardContent, CardDescription, CardTitle, Skeleton } from "@nowly/ui";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { WidgetConfig } from "@nowly/analytics";
import { useEffect, useState } from "react";

type SeriesResponse = { total: number };

const buildQuery = (widget: Extract<WidgetConfig, { kind: "metric-total" }>): string => {
  const params = new URLSearchParams({ metric: widget.metric });
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

export const WidgetCardStat = ({ widget }: { widget: Extract<WidgetConfig, { kind: "metric-total" }> }) => {
  const [value, setValue] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setValue(null);
    setError(false);

    apiFetch<SeriesResponse>(`/insights/series?${buildQuery(widget)}`)
      .then((data) => {
        if (!cancelled) setValue(data.total);
      })
      .catch((err) => {
        if (!cancelled) setError(!(err instanceof ApiError && err.status === 404));
      });

    return () => {
      cancelled = true;
    };
  }, [widget]);

  return (
    <Card>
      <CardContent>
        <CardDescription className="truncate">{widget.title}</CardDescription>
        {value === null && !error ? (
          <Skeleton className="mt-2 h-9 w-20" />
        ) : (
          <CardTitle className="mt-1 text-3xl font-semibold">
            {error ? "—" : value?.toLocaleString()}
          </CardTitle>
        )}
      </CardContent>
    </Card>
  );
};

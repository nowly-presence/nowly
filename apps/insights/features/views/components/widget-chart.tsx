"use client";

import { Card, CardContent, CardDescription, CardTitle, ChartContainer, ChartTooltip, ChartTooltipContent, Skeleton, type ChartConfig } from "@nowly/ui";
import { apiFetch } from "@/features/api-target/lib/api-client";
import type { WidgetConfig } from "@nowly/analytics";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";

type SeriesPoint = { bucket: string; count: number };
type SeriesResponse = { points: SeriesPoint[]; total: number; comparePoints?: SeriesPoint[] };
type ChartRow = { bucket: string; count: number; compareCount?: number };

const chartConfig: ChartConfig = {
  count: { label: "Count", color: "var(--chart-1)" },
  compareCount: { label: "Previous period", color: "var(--chart-2)" },
};

const buildQuery = (widget: Extract<WidgetConfig, { kind: "metric-series" }>): string => {
  const params = new URLSearchParams({ metric: widget.metric });
  if (widget.range === "custom" && widget.from && widget.to) {
    params.set("from", widget.from);
    params.set("to", widget.to);
  } else {
    params.set("range", widget.range);
  }
  if (widget.granularity) params.set("granularity", widget.granularity);
  if (widget.compare) params.set("compare", "true");
  for (const [key, value] of Object.entries(widget.filters)) {
    if (value) params.set(key, value);
  }
  return params.toString();
};

const formatBucket = (bucket: string): string => {
  const date = new Date(bucket);
  return Number.isNaN(date.getTime()) ? bucket : date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const WidgetChart = ({ widget }: { widget: Extract<WidgetConfig, { kind: "metric-series" }> }) => {
  const [rows, setRows] = useState<ChartRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(false);

    apiFetch<SeriesResponse>(`/insights/series?${buildQuery(widget)}`)
      .then((data) => {
        if (cancelled) return;
        const merged: ChartRow[] = data.points.map((point, index) => ({
          bucket: point.bucket,
          count: point.count,
          compareCount: data.comparePoints?.[index]?.count,
        }));
        setRows(merged);
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
        <CardDescription className="truncate">{widget.title}</CardDescription>
        <CardTitle className="mt-1 truncate text-base font-medium">{widget.metric}</CardTitle>

        {rows === null && !error ? (
          <Skeleton className="mt-4 h-[200px] w-full" />
        ) : error || !rows || rows.length === 0 ? (
          <div className="mt-4 flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            {error ? "Could not load data" : "No data"}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="mt-4">
            {widget.chartType === "bar" ? (
              <BarChart data={rows}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="bucket" tickFormatter={formatBucket} tickLine={false} axisLine={false} minTickGap={32} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => formatBucket(String(value))} />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                {widget.compare ? <Bar dataKey="compareCount" fill="var(--color-compareCount)" radius={4} /> : null}
              </BarChart>
            ) : widget.chartType === "area" ? (
              <AreaChart data={rows}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="bucket" tickFormatter={formatBucket} tickLine={false} axisLine={false} minTickGap={32} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => formatBucket(String(value))} />} />
                <Area dataKey="count" fill="var(--color-count)" stroke="var(--color-count)" type="monotone" />
                {widget.compare ? (
                  <Area dataKey="compareCount" fill="var(--color-compareCount)" stroke="var(--color-compareCount)" type="monotone" fillOpacity={0.3} />
                ) : null}
              </AreaChart>
            ) : (
              <LineChart data={rows}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="bucket" tickFormatter={formatBucket} tickLine={false} axisLine={false} minTickGap={32} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => formatBucket(String(value))} />} />
                <Line dataKey="count" stroke="var(--color-count)" type="monotone" dot={false} />
                {widget.compare ? (
                  <Line dataKey="compareCount" stroke="var(--color-compareCount)" type="monotone" strokeDasharray="4 4" dot={false} />
                ) : null}
              </LineChart>
            )}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

"use client";

import { apiFetch } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  type ChartConfig,
} from "@nowly/ui";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

type MetricOption = { metric: string; dimension: string; count: number };
type SeriesRow = { date: string; dimensionValue: string; value: number };

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const optionLabel = (option: MetricOption): string =>
  option.dimension === "total" ? option.metric : `${option.metric} — ${option.dimension}`;

const optionKey = (option: { metric: string; dimension: string }): string => `${option.metric}::${option.dimension}`;

export const CwsStatsView = () => {
  const [options, setOptions] = useState<MetricOption[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [rows, setRows] = useState<SeriesRow[] | null>(null);

  useEffect(() => {
    apiFetch<{ metrics: MetricOption[] }>("/insights/cws-stats/list")
      .then((data) => {
        setOptions(data.metrics);
        setSelected(data.metrics[0] ? optionKey(data.metrics[0]) : null);
      })
      .catch(() => setOptions([]));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setRows(null);
    const [metric, dimension] = selected.split("::");
    apiFetch<{ rows: SeriesRow[] }>(`/insights/cws-stats/series?metric=${metric}&dimension=${dimension}`)
      .then((data) => setRows(data.rows))
      .catch(() => setRows([]));
  }, [selected]);

  const { chartData, dimensionValues, chartConfig } = useMemo(() => {
    if (!rows) return { chartData: [], dimensionValues: [], chartConfig: {} as ChartConfig };

    const values = [...new Set(rows.map((row) => row.dimensionValue))].sort();
    const byDate = new Map<string, Record<string, number | string>>();
    for (const row of rows) {
      const entry = byDate.get(row.date) ?? { date: row.date };
      entry[row.dimensionValue] = row.value;
      byDate.set(row.date, entry);
    }

    const config: ChartConfig = {};
    values.forEach((value, index) => {
      config[value] = { label: value, color: CHART_COLORS[index % CHART_COLORS.length] };
    });

    return {
      chartData: [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))),
      dimensionValues: values,
      chartConfig: config,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Chrome Web Store stats</h1>

      {options && options.length === 0 ? (
        <p className="text-sm text-muted-foreground">No CWS data imported yet.</p>
      ) : (
        <Select
          items={(options ?? []).map((option) => ({ value: optionKey(option), label: optionLabel(option) }))}
          value={selected ?? undefined}
          onValueChange={(value) => value && setSelected(value)}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {(options ?? []).map((option) => (
                <SelectItem key={optionKey(option)} value={optionKey(option)}>
                  {optionLabel(option)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      <Card>
        <CardContent>
          <CardDescription>Daily values</CardDescription>
          <CardTitle className="mt-1 text-base font-medium">{selected?.replace("::", " — ")}</CardTitle>

          {rows === null ? (
            <Skeleton className="mt-4 h-[300px] w-full" />
          ) : rows.length === 0 ? (
            <div className="mt-4 flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              No data
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="mt-4 h-[300px] w-full">
              <LineChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} tickLine={false} axisLine={false} minTickGap={32} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => formatDate(String(value))} />} />
                {dimensionValues.map((value, index) => (
                  <Line
                    key={value}
                    dataKey={value}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    type="monotone"
                    dot={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

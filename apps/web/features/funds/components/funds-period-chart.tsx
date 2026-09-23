"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@nowly/ui";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/features/funds/lib/funds-data";

type Props = {
  data: { period: string; income: number; expenses: number }[]
  currency: string
  locale: string
  incomeLabel: string
  expensesLabel: string
  noData: string
};

export const FundsPeriodChart = ({
  data,
  currency,
  locale,
  incomeLabel,
  expensesLabel,
  noData,
}: Props) => {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{noData}</p>;
  }

  const config = {
    income: {
      label: incomeLabel,
      theme: { light: "#0891B2", dark: "#22D3EE" },
    },
    expenses: {
      label: expensesLabel,
      theme: { light: "#4a5560", dark: "#808e9b" },
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={config}
      className="aspect-[4/3] w-full sm:aspect-[16/9]"
      initialDimension={{ width: 640, height: 360 }}
    >
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={false} className="stroke-border/50" />
        <XAxis
          dataKey="period"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-muted-foreground"
        />
        <YAxis hide />
        <ChartTooltip
          cursor={{ fill: "var(--color-muted)" }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value) => formatCurrency(Number(value), currency, locale)}
            />
          }
        />
        <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  );
};
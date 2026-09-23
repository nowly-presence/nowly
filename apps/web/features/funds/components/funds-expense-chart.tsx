"use client";

import { ChartContainer, cn } from "@nowly/ui";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { FUNDS_PALETTE, formatCurrency } from "@/features/funds/lib/funds-data";

type DonutDatum = {
  label: string
  value: number
  percent: number
};

type Props = {
  data: DonutDatum[]
  currency: string
  locale: string
  fallbackLabel: string
};

const ExpenseTooltip = ({
  active,
  payload,
  currency,
  locale,
  fallbackLabel,
}: {
  active?: boolean
  payload?: unknown[]
  currency: string
  locale: string
  fallbackLabel: string
}) => {
  if (!active || !payload?.length) return null;
  const row = (payload[0] as { payload?: DonutDatum } | undefined)?.payload;
  if (!row) return null;

  return (
    <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="text-muted-foreground">{row.label || fallbackLabel}</div>
      <div className="mt-1 flex items-center justify-between gap-3 font-mono font-medium tabular-nums">
        <span className="text-foreground">{formatCurrency(row.value, currency, locale)}</span>
        <span className="text-muted-foreground">{Math.round(row.percent)}%</span>
      </div>
    </div>
  );
};

export const FundsExpenseChart = ({ data, currency, locale, fallbackLabel }: Props) => {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{fallbackLabel}</p>;
  }

  return (
    <div>
      <ChartContainer
        config={{}}
        className="mx-auto aspect-square max-w-xs"
        initialDimension={{ width: 280, height: 280 }}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            cornerRadius={3}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={FUNDS_PALETTE[index % FUNDS_PALETTE.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={
              <ExpenseTooltip
                currency={currency}
                locale={locale}
                fallbackLabel={fallbackLabel}
              />
            }
          />
        </PieChart>
      </ChartContainer>

      <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {data.map((entry, index) => (
          <li key={entry.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn("size-2 rounded-full", entry.value === 0 && "opacity-40")}
              style={{ backgroundColor: FUNDS_PALETTE[index % FUNDS_PALETTE.length] }}
            />
            <span className="max-w-44 truncate">{entry.label}</span>
            <span className="tabular-nums">{Math.round(entry.percent)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
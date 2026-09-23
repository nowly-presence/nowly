import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@nowly/ui";
import {
  RiBankLine,
  RiCoinsLine,
  RiExternalLinkLine,
  RiLineChartLine,
  RiWallet3Line,
} from "@nowly/ui/icons";
import { FundsExpenseChart } from "@/features/funds/components/funds-expense-chart";
import { FundsPeriodChart } from "@/features/funds/components/funds-period-chart";
import {
  fetchFundsData,
  formatCurrency,
  FUNDS_DATA_URL,
  FUNDS_PALETTE,
} from "@/features/funds/lib/funds-data";
import { getLocale, getTranslations } from "next-intl/server";

const percentOf = (amount: number, total: number): number =>
  total > 0 ? (amount / total) * 100 : 0;

export const FundsView = async () => {
  const [t, locale] = await Promise.all([getTranslations("fundsPage"), getLocale()]);
  const data = await fetchFundsData();
  const fmt = (value: number) => formatCurrency(value, data.currency, locale);

  const expenseTotal =
    data.expenses.total > 0
      ? data.expenses.total
      : data.expenses.items.reduce((sum, item) => sum + item.amount, 0);
  const incomeTotal =
    data.income.total > 0
      ? data.income.total
      : data.income.sources.reduce((sum, source) => sum + source.amount, 0);

  const donutData = data.expenses.items.map((item) => ({
    label: item.label,
    value: item.amount,
    percent: percentOf(item.amount, expenseTotal),
  }));

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <header className="max-w-xl">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">
            {t("description")}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 shrink-0 rounded-full bg-success" />
            <span>{t("updated-at", { date: data.updatedAt })}</span>
            {data.periodLabel ? (
              <span className="text-muted-foreground/60">{t("period", { period: data.periodLabel })}</span>
            ) : null}
            <span className="text-muted-foreground/60">· {data.currency}</span>
          </div>
        </header>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex h-full flex-col">
              <div className="flex size-10 items-center justify-center rounded-[10px] bg-accent/12 text-accent">
                <RiCoinsLine className="size-5" />
              </div>
              <CardTitle className="mt-4">{t("summary.income")}</CardTitle>
              <CardDescription className="mt-1">
                {t("summary.income-description")}
              </CardDescription>
              <p className="mt-3 text-2xl font-medium tabular-nums">
                {fmt(data.income.total)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full flex-col">
              <div className="flex size-10 items-center justify-center rounded-[10px] bg-accent/12 text-accent">
                <RiWallet3Line className="size-5" />
              </div>
              <CardTitle className="mt-4">{t("summary.expenses")}</CardTitle>
              <CardDescription className="mt-1">
                {t("summary.expenses-description")}
              </CardDescription>
              <p className="mt-3 text-2xl font-medium tabular-nums">
                {fmt(data.expenses.total)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full flex-col">
              <div className="flex size-10 items-center justify-center rounded-[10px] bg-accent/12 text-accent">
                <RiBankLine className="size-5" />
              </div>
              <CardTitle className="mt-4">{t("summary.balance")}</CardTitle>
              <CardDescription className="mt-1">
                {t("summary.balance-description")}
              </CardDescription>
              <p className="mt-3 text-2xl font-medium tabular-nums">
                {fmt(data.balance.total)}
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-medium tracking-tight text-foreground">
                {t("expenses.title")}
              </h2>
              <p className="mt-1 text-muted-foreground">{t("expenses.description")}</p>
            </div>
            <p className="text-2xl font-medium tabular-nums">{fmt(expenseTotal)}</p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("expenses.breakdown")}</CardTitle>
                <CardDescription>{t("expenses.breakdown-description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <FundsExpenseChart
                  data={donutData}
                  currency={data.currency}
                  locale={locale}
                  fallbackLabel={t("no-data")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("expenses.by-line")}</CardTitle>
                <CardDescription>{t("expenses.by-line-description")}</CardDescription>
              </CardHeader>
              <CardContent className="flex h-full flex-col gap-4">
                {data.expenses.items.length > 0 ? (
                  data.expenses.items.map((item, index) => {
                    const percent = percentOf(item.amount, expenseTotal);
                    return (
                      <div key={item.label}>
                        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                          <span className="truncate text-foreground">{item.label}</span>
                          <span className="shrink-0 text-muted-foreground tabular-nums">
                            {fmt(item.amount)} · {Math.round(percent)}%
                          </span>
                        </div>
                        <div
                          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-valuenow={Math.round(percent)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={item.label}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(percent, 0)}%`,
                              backgroundColor:
                                FUNDS_PALETTE[index % FUNDS_PALETTE.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">{t("no-data")}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-16">
          <div>
            <h2 className="text-2xl font-medium tracking-tight text-foreground">
              {t("detail.title")}
            </h2>
            <p className="mt-1 text-muted-foreground">{t("detail.description")}</p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("detail.income")}</CardTitle>
                <CardDescription>{t("detail.income-description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground">
                        {t("detail.columns.label")}
                      </th>
                      <th className="h-10 px-2 text-right align-middle font-medium whitespace-nowrap text-foreground">
                        {t("detail.columns.amount")}
                      </th>
                      <th className="h-10 px-2 text-right align-middle font-medium whitespace-nowrap text-foreground">
                        {t("detail.columns.share")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.income.sources.map((source) => (
                      <tr key={source.label} className="border-b transition-colors hover:bg-muted/50">
                        <td className="max-w-56 truncate p-2">{source.label}</td>
                        <td className="p-2 text-right tabular-nums">{fmt(source.amount)}</td>
                        <td className="p-2 text-right text-muted-foreground tabular-nums">
                          {Math.round(percentOf(source.amount, incomeTotal))}%
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="p-2 font-medium">{t("detail.total")}</td>
                      <td className="p-2 text-right font-medium tabular-nums">
                        {fmt(data.income.total)}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("detail.expenses")}</CardTitle>
                <CardDescription>{t("detail.expenses-description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground">
                        {t("detail.columns.label")}
                      </th>
                      <th className="h-10 px-2 text-right align-middle font-medium whitespace-nowrap text-foreground">
                        {t("detail.columns.amount")}
                      </th>
                      <th className="h-10 px-2 text-right align-middle font-medium whitespace-nowrap text-foreground">
                        {t("detail.columns.share")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenses.items.map((item) => (
                      <tr key={item.label} className="border-b transition-colors hover:bg-muted/50">
                        <td className="max-w-56 truncate p-2">{item.label}</td>
                        <td className="p-2 text-right tabular-nums">{fmt(item.amount)}</td>
                        <td className="p-2 text-right text-muted-foreground tabular-nums">
                          {Math.round(percentOf(item.amount, expenseTotal))}%
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="p-2 font-medium">{t("detail.total")}</td>
                      <td className="p-2 text-right font-medium tabular-nums">
                        {fmt(data.expenses.total)}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-16">
          <div>
            <h2 className="text-2xl font-medium tracking-tight text-foreground">
              {t("history.title")}
            </h2>
            <p className="mt-1 text-muted-foreground">{t("history.description")}</p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("history.chart")}</CardTitle>
                <CardDescription>{t("history.chart-description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <FundsPeriodChart
                  data={data.history}
                  currency={data.currency}
                  locale={locale}
                  incomeLabel={t("history.income")}
                  expensesLabel={t("history.expenses")}
                  noData={t("no-data")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("history.periods")}</CardTitle>
                <CardDescription>{t("history.periods-description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground">
                        {t("history.period")}
                      </th>
                      <th className="h-10 px-2 text-right align-middle font-medium whitespace-nowrap text-foreground">
                        {t("history.income")}
                      </th>
                      <th className="h-10 px-2 text-right align-middle font-medium whitespace-nowrap text-foreground">
                        {t("history.expenses")}
                      </th>
                      <th className="h-10 px-2 text-right align-middle font-medium whitespace-nowrap text-foreground">
                        {t("history.balance")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.history.length > 0 ? (
                      data.history.map((row) => (
                        <tr key={row.period} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-2 font-medium">{row.period}</td>
                          <td className="p-2 text-right tabular-nums">{fmt(row.income)}</td>
                          <td className="p-2 text-right tabular-nums">{fmt(row.expenses)}</td>
                          <td
                            className={cn(
                              "p-2 text-right tabular-nums",
                              row.income - row.expenses < 0
                                ? "text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
                            {fmt(row.income - row.expenses)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-2 text-muted-foreground">
                          {t("no-data")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex flex-col gap-4 rounded-[16px] bg-foreground/[0.04] p-6 shadow-[0_0_0_1px_rgba(228,242,255,0.06)] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 hidden size-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/12 text-accent sm:flex">
                <RiLineChartLine className="size-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t("raw.title")}</p>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {t("raw.description")}
                </p>
              </div>
            </div>
            <a
              href={FUNDS_DATA_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {t("raw.open")}
              <RiExternalLinkLine className="size-4" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};
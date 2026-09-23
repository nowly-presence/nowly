/**
 * Funds transparency data.
 *
 * The page reads a single JSON file published on the CDN at `https://cdn.nowly.me/funds.json`.
 * The schema is defined by the types below and is generated interactively by the
 * `funds:generate` command of `packages/internal-cli` (same shape, so both sides agree).
 *
 * Example of the expected document:
 * ```json
 * {
 *   "updatedAt": "2026-09-23",
 *   "currency": "EUR",
 *   "periodLabel": "Year 2026",
 *   "income": {
 *     "total": 1240,
 *     "sources": [
 *       { "label": "Ko-fi donations", "amount": 890 },
 *       { "label": "GitHub Sponsors", "amount": 250 }
 *     ]
 *   },
 *   "expenses": {
 *     "total": 380,
 *     "items": [
 *       { "label": "Hosting (Contabo VPS)", "amount": 120 },
 *       { "label": "Domains", "amount": 40 }
 *     ]
 *   },
 *   "balance": {
 *     "total": 860
 *   },
 *   "history": [
 *     { "period": "Q1 2026", "income": 300, "expenses": 95 }
 *   ]
 * }
 * ```
 */

export type FundsLine = {
  label: string
  amount: number
};

export type FundsPeriod = {
  period: string
  income: number
  expenses: number
};

export type FundsData = {
  updatedAt: string
  currency: string
  periodLabel: string
  income: {
    total: number
    sources: FundsLine[]
  }
  expenses: {
    total: number
    items: FundsLine[]
  }
  balance: {
    total: number
  }
  history: FundsPeriod[]
};

// Slice colors for the expense donut / progress bars. Index-aligned with `expenses.items`.
export const FUNDS_PALETTE = [
  "#0891B2",
  "#0ea5e9",
  "#6366f1",
  "#14b8a6",
  "#d97706",
  "#db2777",
  "#4a5560",
] as const;

// Overridable in local dev (e.g. NEXT_PUBLIC_FUNDS_DATA_URL=http://localhost:3001/funds.json)
// so the page can be previewed against real numbers before they are published to the CDN.
const FUNDS_CDN_URL = (
  process.env.NEXT_PUBLIC_FUNDS_DATA_URL ?? "https://cdn.nowly.me"
).replace(/\/+$/, "");

export const FUNDS_DATA_URL = `${FUNDS_CDN_URL}/funds.json`;

// Demo numbers shown when the CDN file is missing or unreachable, so the page always renders.
export const getFallbackFundsData = (): FundsData => ({
  updatedAt: "2026-09-23",
  currency: "EUR",
  periodLabel: "Year 2026",
  income: {
    total: 1240,
    sources: [
      { label: "Ko-fi donations", amount: 890 },
      { label: "GitHub Sponsors", amount: 250 },
      { label: "One-time donations", amount: 100 },
    ],
  },
  expenses: {
    total: 380,
    items: [
      { label: "Hosting (Contabo VPS)", amount: 120 },
      { label: "Domains", amount: 40 },
      { label: "CDN & object storage", amount: 60 },
      { label: "Tools & services", amount: 95 },
      { label: "Payment processing fees", amount: 65 },
    ],
  },
  balance: {
    total: 860,
  },
  history: [
    { period: "Q1 2026", income: 300, expenses: 95 },
    { period: "Q2 2026", income: 420, expenses: 100 },
    { period: "Q3 2026", income: 520, expenses: 185 },
  ],
});

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isFundsLine = (value: unknown): value is FundsLine => {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return typeof line.label === "string" && line.label.trim() !== "" && isNumber(line.amount);
};

export const isValidFundsData = (value: unknown): value is FundsData => {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  const income = data.income as Record<string, unknown> | undefined;
  const expenses = data.expenses as Record<string, unknown> | undefined;
  const balance = data.balance as Record<string, unknown> | undefined;

  return (
    typeof data.updatedAt === "string" &&
    data.updatedAt.trim() !== "" &&
    typeof data.currency === "string" &&
    data.currency.trim() !== "" &&
    typeof data.periodLabel === "string" &&
    !!income &&
    isNumber(income.total) &&
    Array.isArray(income.sources) &&
    income.sources.every(isFundsLine) &&
    !!expenses &&
    isNumber(expenses.total) &&
    Array.isArray(expenses.items) &&
    expenses.items.every(isFundsLine) &&
    !!balance &&
    isNumber(balance.total) &&
    Array.isArray(data.history) &&
    data.history.every((row) => {
      if (!row || typeof row !== "object") return false;
      const period = row as Record<string, unknown>;
      return (
        typeof period.period === "string" &&
        period.period.trim() !== "" &&
        isNumber(period.income) &&
        isNumber(period.expenses)
      );
    })
  );
};

export const fetchFundsData = async (): Promise<FundsData> => {
  try {
    const res = await fetch(FUNDS_DATA_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return getFallbackFundsData();
    const data: unknown = await res.json();
    return isValidFundsData(data) ? data : getFallbackFundsData();
  } catch {
    return getFallbackFundsData();
  }
};

export const formatCurrency = (value: number, currency: string, locale: string): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { getAccount } from "@/background/storage/account.store";
import { getReporterKey } from "@/background/storage/reports.store";
import { REPORTER_KEY_HEADER, type ReportResult } from "@/shared/reports";

const HTTP_UNAUTHORIZED = 401;

type ReportRequest = {
  staff?: boolean;
  method: "GET" | "POST" | "PUT";
  path: string;
  body?: unknown;
};

const errorCode = (body: unknown, status: number): string =>
  body &&
  typeof body === "object" &&
  typeof (
    body as {
      error?: unknown;
    }
  ).error === "string"
    ? (
        body as {
          error: string;
        }
      ).error
    : `HTTP_${status}`;

export const requestReports = async <T extends object>({ staff = false, method, path, body }: ReportRequest): Promise<ReportResult<T>> => {
  const [key, account] = await Promise.all([
    getReporterKey(),
    getAccount()
  ]);

  const headers: Record<string, string> = { [REPORTER_KEY_HEADER]: key };

  if (account && account.expiresAt > Date.now()) headers.Authorization = `Bearer ${account.token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  try {
    const response = await fetch(`${getEffectiveApiUrl()}${path}`, {
      method,
      cache: "no-store",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) return {
      ok: false,
      error: response.status === HTTP_UNAUTHORIZED ? "UNAUTHORIZED" : errorCode(payload, response.status)
    };

    return {
      ...(payload && typeof payload === "object" ? (payload as T) : ({} as T)),
      ok: true
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "REPORT_FAILED"
    };
  }
};
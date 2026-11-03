import { getDb, hasDatabase } from "@/db/client";
import { statusSample } from "@nowly/database/schema/status";
import { and, desc, eq, lt, lte, or } from "drizzle-orm";
import { serverEnv } from "@nowly/env/server";

export type ServiceStatus = "operational" | "slow" | "degraded" | "down" | "unknown";

export type StatusServiceId = "website" | "api" | "library" | "cdn";

export type StatusSample = {
  serviceId: StatusServiceId;
  checkedAt: string;
  status: Exclude<ServiceStatus, "unknown">;
  responseMs: number | null;
  httpStatus: number | null;
  error: string | null;
};

export type StatusServiceReport = {
  id: StatusServiceId;
  current: StatusSample | null;
  samples: StatusSample[];
};

export type StatusReport = {
  generatedAt: string;
  checkIntervalHours: number;
  overallStatus: ServiceStatus;
  services: StatusServiceReport[];
};

export type StatusCheckResult = {
  report: StatusReport;
  skipped: boolean;
};

type StatusService = {
  id: StatusServiceId;
  url: string;
};

const REQUEST_TIMEOUT_MS = 5000;
const RECENT_SAMPLE_COUNT = 10;

const sampleStore = new Map<StatusServiceId, StatusSample[]>();

const services: StatusService[] = [
  {
    id: "website",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://nowly.me"
  },
  {
    id: "api",
    url: `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nowly.me"}/health`
  },
  {
    id: "library",
    url: `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nowly.me"}/presences`
  },
  {
    id: "cdn",
    url: "https://cdn.nowly.me/installer/latest.json"
  }
];

const getCheckIntervalHours = (): number => serverEnv.STATUS_CHECK_INTERVAL_HOURS;

const getSampleLimit = (): number => Math.max(10, serverEnv.STATUS_SAMPLE_LIMIT);

export const classifyResponse = (ok: boolean, httpStatus: number | null, responseMs: number | null): Exclude<ServiceStatus, "unknown"> => {
  if (!ok || httpStatus === null || httpStatus >= 500 || responseMs === null) return "down";
  if (responseMs <= 750) return "operational";
  if (responseMs <= 2000) return "slow";

  return "degraded";
};

const statusWeight: Record<ServiceStatus, number> = {
  operational: 0,
  slow: 1,
  degraded: 2,
  down: 3,
  unknown: 4
};

const getWorstStatus = (statuses: ServiceStatus[]): ServiceStatus =>
  statuses.reduce<ServiceStatus>((worst, status) => (statusWeight[status] > statusWeight[worst] ? status : worst), "operational");

const measureService = async (id: StatusServiceId, url: string): Promise<StatusSample> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal
    });

    await response.arrayBuffer();
    const responseMs = Math.round(performance.now() - startedAt);

    return {
      serviceId: id,
      checkedAt: new Date().toISOString(),
      status: classifyResponse(response.ok, response.status, responseMs),
      responseMs,
      httpStatus: response.status,
      error: null
    };
  } catch (error) {
    const responseMs = Math.round(performance.now() - startedAt);

    return {
      serviceId: id,
      checkedAt: new Date().toISOString(),
      status: "down",
      responseMs,
      httpStatus: null,
      error: error instanceof Error ? error.name : "FetchError"
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const getStatusReport = async (): Promise<StatusReport> => {
  const reports = await Promise.all(
    services.map(async (svc) => {
      const samples = hasDatabase()
        ? await getDb()
            .select()
            .from(statusSample)
            .where(eq(statusSample.serviceId, svc.id))
            .orderBy(desc(statusSample.checkedAt), desc(statusSample.id))
            .limit(RECENT_SAMPLE_COUNT)
            .then((rows) =>
              rows.map((row): StatusSample => ({
                serviceId: row.serviceId as StatusServiceId,
                checkedAt: row.checkedAt.toISOString(),
                status: row.status as StatusSample["status"],
                responseMs: row.responseMs,
                httpStatus: row.httpStatus,
                error: row.error
              }))
            )
        : (sampleStore.get(svc.id) ?? []);

      return {
        id: svc.id,
        current: samples[0] ?? null,
        samples: samples.slice(0, RECENT_SAMPLE_COUNT)
      };
    })
  );

  return {
    generatedAt: new Date().toISOString(),
    checkIntervalHours: getCheckIntervalHours(),
    overallStatus: getWorstStatus(reports.map((s) => s.current?.status ?? "unknown")),
    services: reports
  };
};

export const runStatusCheck = async (): Promise<StatusCheckResult> => {
  const samples = await Promise.all(services.map((svc) => measureService(svc.id, svc.url)));

  if (hasDatabase()) {
    const db = getDb();
    await db.insert(statusSample).values(
      samples.map((sample) => ({
        serviceId: sample.serviceId,
        checkedAt: new Date(sample.checkedAt),
        status: sample.status,
        responseMs: sample.responseMs,
        httpStatus: sample.httpStatus,
        error: sample.error
      }))
    );

    const sampleLimit = getSampleLimit();
    await Promise.all(
      services.map(async (svc) => {
        const [oldestExcessSample] = await db
          .select({
            id: statusSample.id,
            checkedAt: statusSample.checkedAt
          })
          .from(statusSample)
          .where(eq(statusSample.serviceId, svc.id))
          .orderBy(desc(statusSample.checkedAt), desc(statusSample.id))
          .offset(sampleLimit)
          .limit(1);

        if (oldestExcessSample) {
          await db
            .delete(statusSample)
            .where(
              and(
                eq(statusSample.serviceId, svc.id),
                or(
                  lt(statusSample.checkedAt, oldestExcessSample.checkedAt),
                  and(eq(statusSample.checkedAt, oldestExcessSample.checkedAt), lte(statusSample.id, oldestExcessSample.id))
                )
              )
            );
        }
      })
    );
  } else {
    const sampleLimit = getSampleLimit();

    for (const sample of samples) {
      const existing = sampleStore.get(sample.serviceId) ?? [];
      existing.unshift(sample);
      if (existing.length > sampleLimit) existing.length = sampleLimit;
      sampleStore.set(sample.serviceId, existing);
    }
  }

  return {
    report: await getStatusReport(),
    skipped: false
  };
};
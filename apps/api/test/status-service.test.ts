import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { statusSample } from "@nowly/database/schema/status";
import { createTestDatabase, type TestDatabase } from "./database";

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase();
});
afterAll(() => database.close());

describe("status service persistence", () => {
  beforeEach(async () => {
    await database.reset();
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      })
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("stores check samples and serves the latest values from the database", async () => {
    const { runStatusCheck } = await import("@/features/status/status.service");

    const result = await runStatusCheck();

    vi.resetModules();
    const { overrideDatabase } = await import("@/db/client");
    overrideDatabase(database.db);
    const { getStatusReport } = await import("@/features/status/status.service");

    const report = await getStatusReport();

    expect(await database.db.select().from(statusSample)).toHaveLength(4);
    expect(result.report.services.map((service) => service.current?.status)).toEqual(["operational", "operational", "operational", "operational"]);
    expect(report.services.map((service) => service.current?.serviceId)).toEqual(["website", "api", "library", "cdn"]);
  });

  it("requests four separate endpoints and consumes each response body", async () => {
    const { runStatusCheck } = await import("@/features/status/status.service");
    await runStatusCheck();

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const urls = fetchMock.mock.calls.map(([url]) => new URL(String(url)));
    expect(urls.map((url) => url.pathname)).toEqual(["/", "/health", "/presences", "/installer/latest.json"]);
    expect(new Set(urls.map(String)).size).toBe(4);

    for (const result of fetchMock.mock.results) {
      expect((await result.value).arrayBuffer).toHaveBeenCalled();
    }
  });

  it.each(["website", "api", "library", "cdn"])("isolates an HTTP failure of %s", async (failedId) => {
    const ids = ["website", "api", "library", "cdn"];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("ok"))
    );
    vi.mocked(fetch).mockImplementation(async () => {
      const index = vi.mocked(fetch).mock.calls.length - 1;
      return new Response("body", { status: ids[index] === failedId ? 503 : 200 });
    });
    const { runStatusCheck } = await import("@/features/status/status.service");

    const { report } = await runStatusCheck();

    expect(report.overallStatus).toBe("down");

    for (const service of report.services) {
      expect(service.current?.status).toBe(service.id === failedId ? "down" : "operational");
    }
  });

  it("marks an interrupted response body as down without failing other checks", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: vi.fn().mockRejectedValue(new Error("connection closed"))
    } as unknown as Response);
    const { runStatusCheck } = await import("@/features/status/status.service");

    const { report } = await runStatusCheck();
    expect(report.services.map((service) => service.current?.status)).toEqual(["down", "operational", "operational", "operational"]);
  });

  it("keeps the timeout active until the complete body has arrived", async () => {
    vi.useFakeTimers();

    try {
      vi.mocked(fetch).mockImplementationOnce(
        async (_url, options) =>
          ({
            ok: true,
            status: 200,
            arrayBuffer: () =>
              new Promise((_resolve, reject) => {
                options?.signal?.addEventListener("abort", () => reject(new DOMException("Timed out", "AbortError")), { once: true });
              })
          }) as Response
      );
      const { runStatusCheck } = await import("@/features/status/status.service");

      const pending = runStatusCheck();
      await vi.advanceTimersByTimeAsync(5000);
      const { report } = await pending;
      expect(report.services[0]?.current?.status).toBe("down");
      expect(report.services[0]?.current?.error).toBe("AbortError");
      expect(report.services.slice(1).every((service) => service.current?.status === "operational")).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reads stored status without probing services", async () => {
    const { getStatusReport } = await import("@/features/status/status.service");
    await getStatusReport();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [750, "operational"],
    [751, "slow"],
    [2000, "slow"],
    [2001, "degraded"]
  ] as const)("classifies %i ms as %s", async (ms, expected) => {
    const { classifyResponse } = await import("@/features/status/status.service");
    expect(classifyResponse(true, 200, ms)).toBe(expected);
  });
});
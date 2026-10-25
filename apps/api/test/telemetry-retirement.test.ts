import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../..");

const sources = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "generated" || entry.name === "node_modules") return [];

    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? sources(path) : /\.(ts|tsx)$/.test(entry.name) && !entry.name.includes(".test.") ? [path] : [];
  });

describe("retired Insights collection", () => {
  it("has no old application, event package, ingestion mount, automatic script or runtime event writer", () => {
    for (const path of [
      "apps/insights/package.json",
      "packages/analytics/package.json",
      "apps/api/src/features/insights/insights.routes.ts",
      "apps/web/lib/analytics.ts",
      "apps/extension/src/background/analytics-client.ts"
    ]) {
      expect(existsSync(resolve(root, path)), path).toBe(false);
    }

    for (const directory of ["apps/api/src", "apps/extension/src", "apps/web/app", "apps/web/components", "apps/web/features", "apps/web/lib"]) {
      for (const path of sources(resolve(root, directory))) {
        expect(readFileSync(path, "utf8"), path).not.toMatch(
          /@nowly\/analytics|trackAnalytics|["']\/insights(?:\/events)?["']|analyticsEvent\.|presenceActiveSession\.|stats\.nowly\.me\/script\.js/
        );
      }
    }
  });

  it("retires only the three obsolete tables through a new bounded, irreversible migration", () => {
    expect(existsSync(resolve(root, "apps/api/prisma/schema/analytics.prisma"))).toBe(false);
    expect(existsSync(resolve(root, "apps/api/prisma/schema/insights-view.prisma"))).toBe(false);

    const device = readFileSync(resolve(root, "apps/api/prisma/schema/device.prisma"), "utf8");
    expect(device).not.toContain("PresenceActiveSession");
    expect(device).toContain("model DevicePresence");
    expect(device).toContain("model PresenceActiveDevice");
    expect(device).toContain("model CustomAsset");

    const migration = readFileSync(resolve(root, "apps/api/prisma/migrations/20261025000000_remove_legacy_analytics/migration.sql"), "utf8");
    expect([...migration.matchAll(/DROP TABLE "([^"]+)"/g)].map((match) => match[1]).sort()).toEqual([
      "analytics_events",
      "insights_views",
      "presence_active_sessions"
    ]);
    expect(migration).not.toMatch(/\bCASCADE\b/i);
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("SET LOCAL lock_timeout = '5s';");
    expect(migration).toContain("COMMIT;");
    expect(readFileSync(resolve(root, "apps/api/scripts/reset-dev-data.ts"), "utf8")).not.toMatch(/analytics_|presence_active_sessions|insights_views/);
  });

});

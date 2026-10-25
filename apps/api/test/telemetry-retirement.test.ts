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
          /@nowly\/analytics|trackAnalytics|["']\/insights(?:\/events)?["']|stats\.nowly\.me\/script\.js/
        );
      }
    }
  });

});

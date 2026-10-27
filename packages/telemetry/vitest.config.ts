import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["cobertura"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"]
    }
  }
});
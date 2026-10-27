import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "src") }
  },
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["cobertura"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/generated/**"]
    }
  }
});
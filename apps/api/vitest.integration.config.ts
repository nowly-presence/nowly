import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

const databaseUrl = process.env.NOWLY_TEST_DATABASE_URL
if (!databaseUrl) throw new Error("NOWLY_TEST_DATABASE_URL is required for integration tests")
const target = new URL(databaseUrl)
if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || !target.pathname.endsWith("_test")) {
  throw new Error("Integration tests require a local database with a name ending in _test")
}

export default defineConfig({
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  test: {
    environment: "node",
    include: ["test/**/*.integration.ts"],
    setupFiles: ["test/setup.ts"],
    env: { DATABASE_URL: databaseUrl },
  },
})

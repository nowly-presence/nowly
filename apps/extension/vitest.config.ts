import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { defineConfig } from "vitest/config"

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(root, "src"),
      "@messages": resolve(root, "messages"),
    },
  },
  test: {
    environment: "node",
  },
})

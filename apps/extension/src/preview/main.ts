import { installMockChrome } from "@/preview/mock-chrome"

await installMockChrome()
await import("@/entrypoints/sidepanel/main")

import { dirname, join, resolve } from "path"
import { fileURLToPath } from "url"

export type Browser = "chrome" | "firefox"
export type Channel = "stable" | "canary"

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ROOT = join(__dirname, "..")

export const alias = {
  "@": resolve(ROOT, "src"),
  "@messages": resolve(ROOT, "messages"),
}

export const buildDefine = (browser: Browser, channel: Channel): Record<string, string> => ({
  "import.meta.env.VITE_WEB_BASE_URL": JSON.stringify(process.env.VITE_WEB_BASE_URL ?? "https://nowly.me"),
  "import.meta.env.VITE_API_BASE_URL": JSON.stringify(process.env.VITE_API_BASE_URL ?? "https://api.nowly.me"),
  "import.meta.env.VITE_CDN_BASE_URL": JSON.stringify(
    process.env.VITE_CDN_BASE_URL ?? (channel === "canary" ? "" : "https://cdn.nowly.me"),
  ),
  "import.meta.env.VITE_CHROMEOS_WAITLIST_CAMPAIGN_ID": JSON.stringify(
    process.env.VITE_CHROMEOS_WAITLIST_CAMPAIGN_ID ?? "",
  ),
  "import.meta.env.VITE_NOWLY_CHANNEL": JSON.stringify(channel),
  "import.meta.env.BROWSER": JSON.stringify(browser),
})

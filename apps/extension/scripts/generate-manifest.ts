import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { DEV_CHROME_EXTENSION_ID, manifestConfig } from "../manifest.config"
import type { Browser, Channel } from "./config"

// Chrome extension IDs are 16 bytes encoded as base-a-p (a=0…p=15). This
// derives the equivalent Firefox UUID from a Chrome ID so both browsers
// share the same underlying identity during local/canary testing.
const chromeIdToFirefoxUuid = (chromeId: string): string => {
  const hex = Array.from({ length: chromeId.length / 2 }, (_, i) => {
    const hi = chromeId.charCodeAt(i * 2) - 0x61
    const lo = chromeId.charCodeAt(i * 2 + 1) - 0x61
    return (hi * 16 + lo).toString(16).padStart(2, "0")
  }).join("")
  return `{${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}}`
}

export const generateManifest = (browser: Browser, channel: Channel, version: string, distDir: string): void => {
  const manifest: Record<string, any> = { ...structuredClone(manifestConfig), version }

  if (browser === "firefox") {
    manifest.background = { scripts: ["background.js"] }
    delete manifest.minimum_chrome_version
    delete manifest.key
    // userScripts is an optional-only permission on Firefox - declare it in
    // optional_permissions and request it at runtime (Firefox 136+ MV3 userScripts API).
    manifest.permissions = manifest.permissions.filter((p: string) => p !== "userScripts" && p !== "sidePanel")
    manifest.optional_permissions = ["userScripts"]
    manifest.sidebar_action = {
      default_icon: manifest.icons,
      default_panel: "sidepanel/index.html",
      default_title: "__MSG_extensionName__",
    }
    manifest.commands._execute_sidebar_action = manifest.commands["open-side-panel"]
    delete manifest.commands["open-side-panel"]

    manifest.browser_specific_settings =
      channel === "canary"
        ? {
            gecko: {
              id: chromeIdToFirefoxUuid(DEV_CHROME_EXTENSION_ID),
              strict_min_version: "136.0",
              // Required by AMO - declare data collection practices.
              data_collection_permissions: { required: ["none"] },
            },
          }
        : {
            gecko: {
              id: "nowly@nowly.me",
              strict_min_version: "140.0",
              data_collection_permissions: { required: ["none"] },
            },
            gecko_android: { strict_min_version: "142.0" },
          }
  } else {
    manifest.background = { service_worker: "background.js", type: "module" }
    manifest.side_panel = { default_path: "sidepanel/index.html" }
    if (channel !== "canary") delete manifest.key
  }

  mkdirSync(distDir, { recursive: true })
  writeFileSync(join(distDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
}

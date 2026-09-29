import { extensionEnv } from "@nowly/env/extension"

export const NATIVE_HOST = "nowly.client"
export const EXT_WEB_SOURCE = "Nowly"
export const WEB_BASE_URL = extensionEnv.VITE_WEB_BASE_URL ?? "https://nowly.me"
export const API_BASE_URL = extensionEnv.VITE_API_BASE_URL ?? "https://api.nowly.me"
export const CDN_BASE_URL = extensionEnv.VITE_CDN_BASE_URL ?? "https://cdn.nowly.me"
export const DISCORD_INVITE_URL = "https://discord.gg/MnZap7czgB"
export const GITHUB_URL = "https://github.com/nowly-presence"
export const CHROME_REVIEWS_URL = "https://chromewebstore.google.com/detail/nowly/kmnlnfldimgneaopdihplkebobckcjpf/reviews"
export const FIREFOX_REVIEWS_URL = "https://addons.mozilla.org/firefox/addon/nowly-presence/reviews/"
export const HOST_DOWNLOAD_URL = `${WEB_BASE_URL.replace(/\/$/, "")}/desktop`
export const PRESENCE_REPORT_MAX_LENGTH = 750
export const CHROMEOS_WAITLIST_CAMPAIGN_ID = extensionEnv.VITE_CHROMEOS_WAITLIST_CAMPAIGN_ID ?? ""

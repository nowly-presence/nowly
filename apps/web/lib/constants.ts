export const PROJECT_REPOSITORY_URL = "https://github.com/nowly-presence/nowly";
export const PRESENCES_REPOSITORY_URL = "https://github.com/nowly-presence/presences";
export const DISCORD_INVITE_URL = "https://discord.gg/MnZap7czgB";
export const DISCORD_SITE_URL = "https://discord.com";
export const TWITTER_URL = "https://x.com/nowlyme";
export const KOFI_URL = "https://ko-fi.com/nowly";
export const GITHUB_SPONSORS_URL = "https://github.com/sponsors/nowly-presence";

export const CHROMEOS_WAITLIST_CAMPAIGN_ID = process.env.NEXT_PUBLIC_CHROMEOS_WAITLIST_CAMPAIGN_ID || "";

export const CDN_INSTALLER_BASE_URL = "https://cdn.nowly.me/installer";
export const DESKTOP_LATEST_MANIFEST_URL = `${CDN_INSTALLER_BASE_URL}/latest.json`;
export const CANARY_EXTENSION_ZIP_URL = "https://cdn.nowly.me/extension/nowly-canary.zip";
export const CANARY_FIREFOX_ZIP_URL = "https://cdn.nowly.me/extension/nowly-canary-firefox.zip";

export const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID || "kmnlnfldimgneaopdihplkebobckcjpf";
export const PROJECT_EXTENSION_DOWNLOAD_URL = `https://chromewebstore.google.com/detail/nowly/${EXTENSION_ID}`;
export const FIREFOX_EXTENSION_DOWNLOAD_URL = "https://addons.mozilla.org/en-US/firefox/addon/nowly-presence/";

export const LEGAL_PUBLISHER = {
  name: "Anthony Lejeune",
  siren: "105 793 194",
  address: "7 rue d'Arras, 62450 Bapaume, France",
  email: "contact@qkimi.fr",
} as const;

export const LEGAL_DATA_REGION: Record<"en-US" | "fr-FR" | "es-ES", string> = {
  "en-US": "European Union (VPS provided by Contabo GmbH, Germany)",
  "fr-FR": "Union européenne (VPS fourni par Contabo GmbH, Allemagne)",
  "es-ES": "Unión Europea (VPS proporcionado por Contabo GmbH, Alemania)",
};

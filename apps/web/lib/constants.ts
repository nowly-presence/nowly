import { clientEnv } from "@nowly/env/client";
import { Presence } from "./data/presences";

export const API_BASE_URL = clientEnv.NEXT_PUBLIC_API_BASE_URL;

export const PROJECT_REPOSITORY_URL = "https://github.com/nowly-presence/nowly";
export const PRESENCES_REPOSITORY_URL = "https://github.com/nowly-presence/presences";
export const PROJECT_PRESENCES_SOURCE_URL = `${PRESENCES_REPOSITORY_URL}/tree/stable/src`;

export const PROJECT_ISSUES_URL = `${PROJECT_REPOSITORY_URL}/issues`;
export const PROJECT_BUG_REPORT_URL = `${PROJECT_ISSUES_URL}/new?template=bug_report.yml`;
export const PROJECT_BROKEN_PRESENCE_URL = `${PRESENCES_REPOSITORY_URL}/issues/new?template=broken_presence.yml`;
export const PROJECT_NEW_PRESENCE_URL = `${PRESENCES_REPOSITORY_URL}/issues/new?template=new_presence.yml`;
export const PROJECT_FEATURE_REQUEST_URL = `${PROJECT_ISSUES_URL}/new?template=feature_request.yml`;

export const DISCORD_INVITE_URL = "https://discord.gg/MnZap7czgB";

export const EXTENSION_ID = clientEnv.NEXT_PUBLIC_EXTENSION_ID;
export const PROJECT_EXTENSION_DOWNLOAD_URL = `https://chromewebstore.google.com/detail/nowly/${EXTENSION_ID}`;
export const PROJECT_EXTENSION_FILENAME = "Nowly-Extension.zip";

export const ADSENSE_CLIENT_ID = clientEnv.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
export const ADSENSE_ENABLED = clientEnv.NEXT_PUBLIC_ADSENSE_ENABLED;
export const LANDING_AD_SLOT = clientEnv.NEXT_PUBLIC_ADSENSE_LANDING_SLOT;
export const LIBRARY_AD_SLOT = clientEnv.NEXT_PUBLIC_ADSENSE_LIBRARY_SLOT;

export const HOST_VERSION_URL = "https://nowly.me/host/version";

export const CDN_INSTALLER_BASE_URL = "https://cdn.nowly.me/installer";
export const HOST_LATEST_MANIFEST_URL = `${CDN_INSTALLER_BASE_URL}/latest.json`;

export const buildPresenceUrl = (platform: Presence): string => {
  const firstChar = platform.slug.charAt(0);
  const prefix = /^[0-9]$/.test(firstChar) ? "#" : firstChar.toUpperCase();
  return `${PROJECT_PRESENCES_SOURCE_URL}/${prefix}/${platform.name}`;
};
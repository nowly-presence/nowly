import type { InstalledPresences } from "@/shared/types";

/** Types and pure helpers for the `chrome.userScripts` presence registration. */

export type UserScriptSource = {
  code?: string;
  file?: string;
};

export type RegisteredUserScript = {
  id: string;
  matches: string[];
  js: UserScriptSource[];
  runAt?: "document_start" | "document_end" | "document_idle";
  allFrames?: boolean;
  world?: "USER_SCRIPT" | "MAIN";
};

export type ChromeWithUserScripts = typeof chrome & {
  userScripts?: {
    getScripts(filter?: { ids?: string[] }): Promise<RegisteredUserScript[]>;
    register(scripts: RegisteredUserScript[]): Promise<void>;
    unregister(filter?: { ids?: string[] }): Promise<void>;
  };
};

export const userScriptId = (slug: string): string => `nowly-presence-${slug}`;

export const visiblePresences = (presences: InstalledPresences): InstalledPresences =>
  Object.fromEntries(
    Object.entries(presences).filter(([, presence]) => (
      presence?.metadata?.slug
      && presence.metadata.name
      && Array.isArray(presence.metadata.url)
    )),
  ) as InstalledPresences;

export const toMatchPatterns = (urls: string[]): string[] => {
  const patterns = new Set<string>();

  for (const rawUrl of urls) {
    const raw = rawUrl.trim();
    if (!raw) continue;

    if (raw.includes("://")) {
      const withPath = raw.endsWith("/*") || raw.includes("/", raw.indexOf("://") + 3)
        ? raw
        : `${raw}/*`;
      patterns.add(withPath);
      continue;
    }

    const host = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (host === "*" || host === "*.*" || host === "<all_urls>") continue;
    patterns.add(`*://${host}/*`);

    if (!host.startsWith("*.") && !host.startsWith("*.")) {
      patterns.add(`*://*.${host}/*`);
    }
  }

  return [...patterns];
};

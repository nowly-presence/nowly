import { z } from "zod";
import { CDN_BASE_URL } from "@/shared/constants";

const CACHE_KEY = "hostUpdateCheck";
const CACHE_TTL_MS = 3_600_000;
const REQUEST_TIMEOUT_MS = 10_000;
const MANIFEST_URL = `${CDN_BASE_URL.replace(/\/+$/, "")}/installer/latest.json`;
const RELEASE_VERSION = /^\d{1,9}\.\d{1,9}\.\d{1,9}$/;
const HOST_VERSION = /^v?(\d{1,9}\.\d{1,9}\.\d{1,9})(-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const manifestSchema = z.object({ version: z.string().regex(RELEASE_VERSION) });
const cacheSchema = z.object({
  url: z.literal(MANIFEST_URL),
  checkedAt: z.number().finite().nonnegative(),
  version: z.string().regex(RELEASE_VERSION).optional()
});

let cached: z.infer<typeof cacheSchema> | undefined;
let pending: Promise<void> | null = null;

export const getHostUpdateVersion = (current: string | undefined): string | undefined => {
  const match = current?.match(HOST_VERSION);

  if (!cached?.version || !match?.[1]) return undefined;

  const installed = match[1].split(".").map(Number);

  if (installed.every((part) => part === 0)) return undefined;

  const candidate = cached.version.split(".").map(Number);

  for (const [index, part] of candidate.entries()) {
    const previous = installed[index];

    if (previous === undefined) return undefined;
    if (part !== previous) return part > previous ? cached.version : undefined;
  }

  return match[2] ? cached.version : undefined;
};

export const refreshHostUpdate = (): Promise<void> => {
  if (pending) return pending;

  pending = (async () => {
    if (!cached) {
      const stored = await chrome.storage.local.get(CACHE_KEY);

      const parsed = cacheSchema.safeParse(stored[CACHE_KEY]);
      if (parsed.success) cached = parsed.data;
    }

    const age = cached ? Date.now() - cached.checkedAt : undefined;

    if (age !== undefined && age >= 0 && age < CACHE_TTL_MS) return;

    let version = cached?.version;

    try {
      const response = await fetch(MANIFEST_URL, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        redirect: "error"
      });

      if (!response.ok) throw new Error("HOST_UPDATE_REQUEST_FAILED");

      version = manifestSchema.parse(await response.json()).version;
    } catch {}

    cached = {
      url: MANIFEST_URL,
      checkedAt: Date.now(),
      version
    };
    await chrome.storage.local.set({ [CACHE_KEY]: cached });
  })()
    .catch(() => {})
    .finally(() => {
      pending = null;
    });

  return pending;
};
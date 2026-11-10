import { fetchCdnFile, isCdnPathSegment } from "@/shared/cdn";
import { sha256Base64Url, canonicalJson, signedPayload, signPresenceRelease } from "@/shared/crypto.service";
import { backfillPresenceSettings, getPresenceMeta, getPresenceStats } from "./presence.repository";

export const serializeJsonField = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  if (Array.isArray(value) && value.length === 0) return undefined;

  return JSON.stringify(value);
};

const parseSettings = (raw: string): object | null => {
  try {
    const parsed: unknown = JSON.parse(raw);

    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const buildRelease = async (slug: string, version?: string) => {
  if (version !== undefined && !isCdnPathSegment(version)) return null;

  const storedMeta = await getPresenceMeta(slug);

  if (!storedMeta || !Object.keys(storedMeta).length) return null;

  const stats = await getPresenceStats(slug);

  const resolvedVersion = version ?? stats.version ?? storedMeta.version ?? "0.0.0";
  const versionText = String(resolvedVersion);

  const bundle = await fetchCdnFile(slug, versionText, "bundle.js");

  if (!bundle) return null;

  let iframeBundle: string | null = null;

  if (storedMeta.iframe === true) {
    iframeBundle = await fetchCdnFile(slug, versionText, "iframe.js");

    if (!iframeBundle?.trim()) return null;
  }

  let settings = storedMeta.settings;

  if (!settings) {
    const raw = await fetchCdnFile(slug, versionText, "settings.json");

    const parsed = raw ? parseSettings(raw) : null;

    if (parsed) {
      settings = parsed;

      try {
        await backfillPresenceSettings(slug, versionText, parsed);
      } catch (error) {
        console.warn(`Settings backfill failed for ${slug}@${versionText}`, error);
      }
    }
  }

  const releaseMetadata = {
    ...storedMeta,
    ...(settings ? { settings } : {}),
    slug,
    version: resolvedVersion
  };

  const sha256 = sha256Base64Url(bundle);
  const iframeSha256 = iframeBundle ? sha256Base64Url(iframeBundle) : undefined;
  const metadataHash = sha256Base64Url(canonicalJson(releaseMetadata));
  const signedAt = new Date().toISOString();
  const payload = signedPayload({
    slug,
    version: String(resolvedVersion),
    sha256,
    metadataHash,
    ...(iframeSha256 ? { iframeSha256 } : {}),
    signedAt
  });

  return {
    slug,
    version: resolvedVersion,
    metadata: releaseMetadata,
    bundle,
    sha256,
    metadataHash,
    ...(iframeBundle && iframeSha256 ? { iframeBundle, iframeSha256 } : {}),
    signature: signPresenceRelease(payload),
    signedAt,
    totalInstalls: stats.totalInstalls,
    activeUsers: stats.activeUsers,
    addedAt: stats.addedAt,
    lastUpdated: stats.lastUpdated
  };
};
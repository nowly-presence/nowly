import { addRuntimeLog } from "@/background/runtime-logs"
import { presenceInjector } from "@/background/runtime/presence-injection"
import { createPresenceRuntime } from "@/background/runtime/presence-runtime"
import { RegisteredUserScript, toMatchPatterns, userScriptId } from "@/background/runtime/user-scripts"
import { getEffectiveApiUrl } from "@/background/services/api-state"
import { verifyPresenceRelease } from "@/background/services/release-security"
import { getPresenceSettings, setDebug } from "@/background/storage/presences.store"
import { getSettings } from "@/background/storage/settings.store"
import { CDN_BASE_URL } from "@/shared/constants"
import type { ExtensionSettings, InstalledPresences, PresenceMetadata, StoredPresence } from "@/shared/types"

export const unregisterPresenceScript = async (slug: string): Promise<void> => {
  try {
    await presenceInjector.unregister(userScriptId(slug))
  } catch {
    // The script may not be registered yet.
  }
}

export const getPresenceStrings = (slug: string, metadata: PresenceMetadata, settings: ExtensionSettings): Record<string, string> => {
  if (!metadata.locales) return {}
  const configured =
    settings.presenceLanguage === "per-presence" || !settings.presenceLanguage
      ? (settings.presenceLanguages?.[slug] ?? "en-US")
      : settings.presenceLanguage
  return metadata.locales[configured] ?? metadata.locales["en-US"] ?? {}
}

export const getPresenceRuntime = async (slug: string, metadata: PresenceMetadata, bundle: string): Promise<string> => {
  const [allSettings, extensionSettings] = await Promise.all([getPresenceSettings(), getSettings()])
  const presenceSettings = allSettings[slug] ?? {}
  const strings = getPresenceStrings(slug, metadata, extensionSettings)
  return createPresenceRuntime(slug, metadata.name, bundle, presenceSettings, strings, getEffectiveApiUrl(), CDN_BASE_URL)
}

export const registerPresenceScript = async (slug: string, presence: StoredPresence): Promise<{ ok: boolean; error?: string }> => {
  if (!presence.release) return { ok: false, error: "PRESENCE_RELEASE_NOT_SIGNED" }
  const verified = await verifyPresenceRelease(presence.release, slug)
  if (!verified.ok) return verified

  const metadata = presence.release.metadata
  const matches = toMatchPatterns(metadata.url)
  if (!matches.length) return { ok: false, error: "PRESENCE_NO_VALID_URL_PATTERNS" }
  if (!presence.release.bundle?.trim()) return { ok: false, error: "PRESENCE_NO_BUNDLE" }

  try {
    addRuntimeLog("info", "presence", "register presence script", { slug, version: presence.release.version })
    await unregisterPresenceScript(slug)
    const code = await getPresenceRuntime(slug, metadata, presence.release.bundle)

    const script: RegisteredUserScript = {
      id: userScriptId(slug),
      matches,
      js: [{ code }],
      runAt: metadata.runAt ?? "document_idle",
      allFrames: false,
      world: metadata.world === "main" ? "MAIN" : "USER_SCRIPT",
    }
    await presenceInjector.register(script)
    return { ok: true }
  } catch (error) {
    addRuntimeLog("error", "presence", "register presence script failed", {
      slug,
      error: error instanceof Error ? error.message : "FAILED_TO_REGISTER_PRESENCE_USER_SCRIPT",
    })
    return { ok: false, error: error instanceof Error ? error.message : "FAILED_TO_REGISTER_PRESENCE_USER_SCRIPT" }
  }
}

export const syncPresenceScripts = async (presences: InstalledPresences): Promise<void> => {
  for (const [slug, presence] of Object.entries(presences)) {
    if (!presence.enabled) {
      await unregisterPresenceScript(slug)
      continue
    }

    const result = await registerPresenceScript(slug, presence)
    if (!result.ok) {
      await setDebug({ stage: "userScripts", message: `[${slug}] ${result.error ?? "failed to register presence"}`, updatedAt: Date.now() })
    }
  }
}

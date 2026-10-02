import { addRuntimeLog } from "@/background/runtime-logs"
import { presenceInjector } from "@/background/runtime/presence-injection"
import { createPresenceRuntime } from "@/background/runtime/presence-runtime"
import { type RegisteredUserScript, iframeUserScriptId, userScriptId } from "@/background/runtime/user-scripts"
import { toMatchPatterns } from "@/shared/url-patterns"
import { getEffectiveApiUrl } from "@/background/services/api-state"
import { verifyPresenceRelease } from "@/background/services/release-security"
import { getPresences, getPresenceSettings, setDebug } from "@/background/storage/presences.store"
import { getSettings } from "@/background/storage/settings.store"
import { CDN_BASE_URL } from "@/shared/constants"
import { loadLocale, type Locale } from "@/shared/locales"
import { configuredPresenceLocale } from "@/shared/presence-language"
import type { ExtensionSettings, InstalledPresences, PresenceMetadata, StoredPresence } from "@/shared/types"

export const unregisterPresenceScript = async (slug: string): Promise<void> => {
  for (const id of [userScriptId(slug), iframeUserScriptId(slug)]) {
    try {
      await presenceInjector.unregister(id)
    } catch {
    }
  }
}
export const getPresenceStrings = (slug: string, metadata: PresenceMetadata, settings: ExtensionSettings, uiLocale: Locale): Record<string, string> => {
  if (!metadata.locales) return {}
  const configured = configuredPresenceLocale(settings, slug, metadata.locales, uiLocale)
  return metadata.locales[configured] ?? metadata.locales["en-US"] ?? {}
}

export const getPresenceRuntime = async (
  slug: string,
  metadata: PresenceMetadata,
  bundle: string,
  options: { mode?: "main" | "iframe"; iframeRegExp?: string } = {},
): Promise<string> => {
  const [allSettings, extensionSettings, uiLocale] = await Promise.all([getPresenceSettings(), getSettings(), loadLocale()])
  const presenceSettings = allSettings[slug] ?? {}
  const strings = getPresenceStrings(slug, metadata, extensionSettings, uiLocale)
  return createPresenceRuntime(
    slug,
    metadata.name,
    bundle,
    presenceSettings,
    strings,
    getEffectiveApiUrl(),
    CDN_BASE_URL,
    options,
  )
}

export const registerPresenceScript = async (slug: string, presence: StoredPresence): Promise<{ ok: boolean; error?: string }> => {
  if (!presence.release) return { ok: false, error: "PRESENCE_RELEASE_NOT_SIGNED" }
  const verified = await verifyPresenceRelease(presence.release, slug)
  if (!verified.ok) return verified

  const metadata = presence.release.metadata
  const matches = toMatchPatterns(metadata.url)
  if (!matches.length) return { ok: false, error: "PRESENCE_NO_VALID_URL_PATTERNS" }
  if (!presence.release.bundle?.trim()) return { ok: false, error: "PRESENCE_NO_BUNDLE" }

  const iframeEnabled = metadata.iframe === true
  const iframeRegExp = metadata.iFrameRegExp
  const iframeBundle = presence.release.iframeBundle
  if (iframeEnabled && (!iframeRegExp?.trim() || !iframeBundle?.trim())) {
    return { ok: false, error: !iframeRegExp?.trim() ? "PRESENCE_IFRAME_PATTERN_MISSING" : "PRESENCE_IFRAME_BUNDLE_MISSING" }
  }
  if (iframeEnabled) {
    try {
      new RegExp(iframeRegExp!)
    } catch {
      return { ok: false, error: "PRESENCE_IFRAME_PATTERN_INVALID" }
    }
  }

  try {
    addRuntimeLog("info", "presence", "register presence script", { slug, version: presence.release.version })
    await unregisterPresenceScript(slug)

    const mainCode = await getPresenceRuntime(slug, metadata, presence.release.bundle, {
      iframeRegExp: iframeRegExp ?? "",
    })
    await presenceInjector.register({
      id: userScriptId(slug),
      matches,
      js: [{ code: mainCode }],
      runAt: metadata.runAt ?? "document_idle",
      allFrames: false,
      world: metadata.world === "main" ? "MAIN" : "USER_SCRIPT",
    })

    if (iframeEnabled) {
      const iframeCode = await getPresenceRuntime(slug, metadata, iframeBundle!, {
        mode: "iframe",
        iframeRegExp: iframeRegExp!,
      })
      const iframeScript: RegisteredUserScript = {
        id: iframeUserScriptId(slug),
        matches: ["<all_urls>"],
        js: [{ code: iframeCode }],
        runAt: metadata.runAt ?? "document_idle",
        allFrames: true,
        world: metadata.world === "main" ? "MAIN" : "USER_SCRIPT",
      }
      await presenceInjector.register(iframeScript)
    }

    return { ok: true }
  } catch (error) {
    await unregisterPresenceScript(slug)
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

export const refreshPresenceLanguage = async (): Promise<void> => {
  const [presences, presenceSettings, settings, uiLocale] = await Promise.all([getPresences(), getPresenceSettings(), getSettings(), loadLocale()])
  await syncPresenceScripts(presences)

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return

  for (const [slug, stored] of Object.entries(presences)) {
    if (!stored.enabled || !stored.metadata.locales) continue
    chrome.tabs
      .sendMessage(tab.id, {
        type: "PRESENCE_SETTINGS_UPDATED",
        slug,
        settings: presenceSettings[slug] ?? {},
        strings: getPresenceStrings(slug, stored.metadata, settings, uiLocale),
      })
      .catch(() => {})
  }
}

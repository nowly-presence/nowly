import { sendMessage } from "@/lib/messages"

const LOCAL_KEYS = ["settings", "presenceSettings", "deviceId"]

const downloadJson = (fileName: string, data: unknown): void => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }))
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export const exportDeviceData = async (installedSlugs: string[]): Promise<boolean> => {
  const [result, local] = await Promise.all([sendMessage("EXPORT_DEVICE_DATA"), chrome.storage.local.get(LOCAL_KEYS)])
  if (!result.ok && result.error !== "DEVICE_TOKEN_MISSING") return false
  const exportedAt = new Date().toISOString()
  downloadJson(`nowly-data-${exportedAt.slice(0, 10)}.json`, {
    exportedAt,
    extensionVersion: chrome.runtime.getManifest().version,
    local: { ...local, installedPresences: installedSlugs },
    server: result.ok ? result.data : null,
  })
  return true
}

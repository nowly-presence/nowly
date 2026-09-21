import { useCallback, useRef, useState } from "react"
import { trackUiEvent } from "@/lib/analytics"
import { sendMessage } from "@/lib/messages"
import { WEB_BASE_URL } from "@/shared/constants"
import type { NativeStatus } from "@/shared/types"

export type HostVersionInfo = {
  currentVersion?: string
  latestVersion: string
  updateAvailable: boolean
}

export type UseHostVersion = {
  hostVersionInfo: HostVersionInfo | null
  isCheckingHostVersion: boolean
  checkHostUpdate: () => Promise<void>
  fetchHostVersion: (options?: FetchHostVersionOptions) => Promise<void>
}

type FetchHostVersionOptions = {
  restartNative?: boolean
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms))

const getNativeStatusAfterOptionalRestart = async (restartNative: boolean): Promise<NativeStatus | undefined> => {
  if (!restartNative) return sendMessage("GET_NATIVE_STATUS")

  await sendMessage("RESTART_NATIVE")
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await delay(250)
    const status = await sendMessage("GET_NATIVE_STATUS")
    if (status?.version) return status
  }

  return sendMessage("GET_NATIVE_STATUS")
}

/** Fetches the latest native-host version and compares it with the connected one. */
export const useHostVersion = (): UseHostVersion => {
  const [isCheckingHostVersion, setIsCheckingHostVersion] = useState(false)
  const [hostVersionInfo, setHostVersionInfo] = useState<HostVersionInfo | null>(null)
  const outdatedTrackedRef = useRef(false)

  const fetchHostVersion = useCallback(async (options: FetchHostVersionOptions = {}): Promise<void> => {
    try {
      const url = `${WEB_BASE_URL.replace(/\/$/, "")}/host/version`

      const [res, currentStatus] = await Promise.all([
        fetch(url, { signal: AbortSignal.timeout(5000) }),
        getNativeStatusAfterOptionalRestart(options.restartNative === true),
      ])
      if (!res.ok) throw new Error("failed to fetch host version")
      const data = (await res.json()) as { version: string }
      if (typeof data.version !== "string" || !data.version) throw new Error("host version missing")
      const currentVersion = currentStatus?.version
      const updateAvailable = Boolean(currentVersion && data.version !== currentVersion)
      setHostVersionInfo({ currentVersion, latestVersion: data.version, updateAvailable })
      if (updateAvailable && !outdatedTrackedRef.current) {
        outdatedTrackedRef.current = true
        trackUiEvent("native_version_outdated", { version: currentVersion })
      }
    } catch {
      // Host unreachable - keep previous state
    }
  }, [])

  const checkHostUpdate = useCallback(async (): Promise<void> => {
    if (isCheckingHostVersion) return
    setIsCheckingHostVersion(true)
    try {
      await fetchHostVersion({ restartNative: true })
    } finally {
      setIsCheckingHostVersion(false)
    }
  }, [fetchHostVersion, isCheckingHostVersion])

  return { hostVersionInfo, isCheckingHostVersion, checkHostUpdate, fetchHostVersion }
}

import { useEffect, useState } from "react"

export const useIsChromeOs = (): boolean => {
  const [isChromeOs, setIsChromeOs] = useState(false)

  useEffect(() => {
    const detect = async (): Promise<void> => {
      try {
        const platform = await chrome.runtime.getPlatformInfo()
        setIsChromeOs(platform.os === "cros")
      } catch {
        setIsChromeOs(false)
      }
    }

    void detect()
  }, [])

  return isChromeOs
}

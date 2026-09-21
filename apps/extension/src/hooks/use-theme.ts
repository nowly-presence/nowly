import { useEffect } from "react"
import type { AppearanceMode } from "@/shared/types"

const MEDIA_QUERY = "(prefers-color-scheme: dark)"

// Applies apps/web's light/dark convention (:root = light, .dark = override)
// to the side panel root. "system" follows the OS preference live.
export const useTheme = (appearance: AppearanceMode = "system"): void => {
  useEffect(() => {
    const root = document.documentElement

    const apply = (isDark: boolean): void => {
      root.classList.toggle("dark", isDark)
    }

    if (appearance !== "system") {
      apply(appearance === "dark")
      return
    }

    const media = window.matchMedia(MEDIA_QUERY)
    apply(media.matches)

    const onChange = (event: MediaQueryListEvent): void => apply(event.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [appearance])
}

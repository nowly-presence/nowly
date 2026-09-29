import { useEffect, useState } from "react"
import type { AppearanceMode } from "@/shared/types"

const prefersDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false

export const useResolvedTheme = (appearance: AppearanceMode | undefined): "light" | "dark" => {
  const [systemDark, setSystemDark] = useState(prefersDark)
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)")
    if (!media) return
    const onChange = () => setSystemDark(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])
  const theme = appearance === "dark" || (appearance !== "light" && systemDark) ? "dark" : "light"

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  return theme
}

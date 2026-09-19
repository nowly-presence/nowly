import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "@/entrypoints/sidepanel/app"
import "@/ui/tokens.css"

document.title = chrome.i18n.getMessage("extensionName") || "Nowly"
if (import.meta.env.VITE_NOWLY_CHANNEL === "canary") {
  document.documentElement.dataset.channel = "canary"
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
